from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.db import transaction
from .models import PanoramaImage,PanoramaVideo,TypeInfo
import os
import aiofiles
import asyncio
import cv2
import numpy as np
import json
import base64
from .form import TreeInfoForm
import decimal
import ffmpeg
from datetime import datetime
# Create your views here.

def dashboard(request):
    return render(request, 'map/dashboard.html')


def index(request):
    # 查询所有视频对象
    videos = PanoramaVideo.objects.all()
    video_data = []

    for video in videos:
        # 获取该视频的第一张帧图片
        first_image = PanoramaImage.objects.filter(video_id=video.id).order_by('image').first()
        
        if first_image:
            # 如果有帧图片，获取图片的 URL
            image_url = os.path.join(settings.MEDIA_URL, first_image.image.url)
            image_path = first_image.image.path
            image = cv2.imread(image_path)

            if image is not None:
                h, w, _ = image.shape
                face_w = w // 6
                face_h = h

                interface = image[:, face_w * 4 : face_w * 5] ## get cube image's <front-face> range
                _, buffer = cv2.imencode('.jpg', interface)
                img_base64 = base64.b64encode(buffer).decode('utf-8')
                img_data = f"data:image/jpeg;base64,{img_base64}"
                # 构造传递给前端的数据
                video_data.append({
                    'video_id': video.id,
                    'video_name': video.name,
                    'first_image': img_data,
                })
            else:
                # 如果无法读取图像，使用占位图
                image_url = os.path.join(settings.STATIC_URL, 'placeholder.png')
                video_data.append({
                    'video_id': video.id,
                    'video_name': video.name,
                    'first_image': image_url,
                })

        else:
            # 如果没有帧图片，可以设置一个占位图或 None
            image_url = os.path.join(settings.STATIC_URL, 'placeholder.png')  # 替换为实际的占位图片路径
        
            # 构造传递给前端的数据
            video_data.append({
                'video_id': video.id,
                'video_name': video.name,
                'first_image': image_url,
            })

    context = {
        'data': video_data,  # 每个视频及其对应第一帧图片的数据
    }

    return render(request, 'map/index.html', context)

# 异步文件写入
async def write_file_async(file_path, file_chunk, offset):
    mode = 'wb' if offset == 0 else 'ab'
    async with aiofiles.open(file_path, mode) as f:
        await f.write(file_chunk.read())

def panorama_to_cubemap(image, cube_width, cube_height):
    """
        from panorama(equirectangular) to cube image

        args:
            image: panorama image's numpy array
            cube_width, cube_height: each cube image size
        return:
            6 cube mapping dictionary
    """
    # cube direction
    # right,left,up,down,front,back

    directions = {
        "r": np.array([1, 0, 0]),  # X+
        "l": np.array([-1, 0, 0]), # X-
        "u": np.array([0, 1, 0]),  # Y+
        "d": np.array([0, -1, 0]), # Y-
        "f": np.array([0, 0, 1]),  # Z+
        "b": np.array([0, 0, -1]), # Z-
    }

    h, w = image.shape[:2]
    cubemap_faces = []
    if not isinstance(image, np.ndarray) or h == 0 or w == 0:
        raise ValueError("Input image must be a valid numpy array with non-zero dimensions")

    for face_name, direction in directions.items():
        face = render_cubemap_face(image, w, h, cube_width, cube_height, direction)
        cubemap_faces.append(face)
    
    # stack image in one line: right, left, up, down, front, back
    stack_image = np.hstack(cubemap_faces)
    
    return stack_image

def render_cubemap_face(image, width, height, cube_width, cube_height, direction):
    """
        each cube

        args:
            image: input panorama image(`numpy array`)
            width: panorama image width
            height: panorama image height
            cube_width, cube_height: cube image size
            direction: crop image direction
        return:
            cube images
    """
    # 立方体面采样坐标
    u, v = np.meshgrid(
        np.linspace(-1, 1, cube_width),
        np.linspace(-1, 1, cube_height)
    )
    d = np.ones_like(u)

    if direction[0] == 1:  # Left (X-)
        x, y, z = u, -v, d
    elif direction[0] == -1:  # Right (X+)
        x, y, z = -u, -v, -d
    elif direction[1] == 1:  # Up (Y+)
        x, y, z = u, d, v
    elif direction[1] == -1:  # Down (Y-)
        x, y, z = u, -d, -v
    elif direction[2] == 1:  # Front (Z+)
        x, y, z = -d, -v, u
    elif direction[2] == -1:  # Back (Z-)
        x, y, z = d, -v, -u
    else:
        raise ValueError("Invalid direction")

    # 将方向转换为 equirectangular 图的 UV 坐标
    lon = np.arctan2(x, z)
    lat = np.arcsin(y / np.sqrt(x**2 + y**2 + z**2))

    u = (lon / (2 * np.pi) + 0.5) * width
    v = (0.5 - lat / np.pi) * height

    # 插值采样
    face = cv2.remap(
        image,
        u.astype(np.float32),
        v.astype(np.float32),
        interpolation=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_WRAP
    )
    ## rotate up && down image for threejs stack
    if direction[1] == 1:  # Up
        face = cv2.rotate(face, cv2.ROTATE_90_COUNTERCLOCKWISE)  # 顺时针旋转 90 度
    elif direction[1] == -1:  # Down
        face = cv2.rotate(face, cv2.ROTATE_90_CLOCKWISE)
    return face


def crop_frame_to_img(video_obj, interval=3):
    '''
        get frame from video, crop 6 images for a cube from each frame image.
        
        args:
            video_obj: video file from db
            interval: frame step
        return:
            status code:
                `200: success,
                406: failed`
    '''
    # read video file
    video_path = video_obj.video.path

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print('can not open video file')
        return 406
    
    # cap_time = ffmpeg.probe(video_path)['format']['tags']['comment']
    # init_time = datetime.strptime(cap_time, '%Y-%m-%d %H:%M:%S +0000') ## video start record time tz=KR

    # get video frame info
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    second = 0

    # make img path: '/media/img/{video_id}'
    save_path = os.path.join(settings.MEDIA_ROOT, "img", str(video_obj.id))
    os.makedirs(save_path, exist_ok=True)
    
    # cut video frame image per 3s
    while second < duration:
        frame_index = int(fps * second)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)

        ret, frame = cap.read()
        if not ret:
            print(f'Frame at {second} seconds could not be read')
            break
        
        # crop panorama to "front", "back", "left", "right", "up", "down",  6 images
        height, width, _ = frame.shape
        if width / height != 2:
            raise ValueError(f"frame size is:{width}:{height}, not 2:1")
        
        # calc crop img size
        cube_width = width // 4
        cube_height = height // 2
        cubemap_faces = panorama_to_cubemap(frame, cube_width, cube_height)

        frame_filename = f"frame_{second:04d}.jpg"
        frame_path = os.path.join(save_path, frame_filename)
        cv2.imwrite(frame_path, cubemap_faces)

        PanoramaImage.objects.create(
            image=os.path.relpath(frame_path, settings.MEDIA_ROOT),
            video_id=video_obj
        )

        second += interval

    cap.release()

    return 200

@csrf_exempt
def videoupload(request):

    if request.method == 'POST':
        file_chunk = request.FILES['fileChunk']
        filename = request.POST['fileName']
        offset = int(request.POST['offset'])
        file_type = request.POST['fileType']
        total_size = int(request.POST['totalSize'])

        if file_type.lower() not in ('.mp4'):
            return JsonResponse({'error': 'File type Error'}, status=415)


        temp_file_path = os.path.join(settings.MEDIA_ROOT, "temp/")
        os.makedirs(temp_file_path, exist_ok=True)
        temp_file = os.path.join(temp_file_path, filename)

        # 异步文件写入
        asyncio.run(write_file_async(temp_file, file_chunk, offset))

        current_size = os.path.getsize(temp_file)

        if current_size >= total_size:
            try:
                video_obj = PanoramaVideo.objects.create(
                    name=os.path.basename(temp_file),
                    video=os.path.relpath(temp_file, settings.MEDIA_ROOT),
                )

                #  make video path: '/media/video/{video_id}'
                video_folder = os.path.join(settings.MEDIA_ROOT, 'video', str(video_obj.id)) 
                os.makedirs(video_folder,exist_ok=True)

                # clean && move temp file to '/media/video/{video_id}'
                source_file = os.path.join(video_folder, filename)
                os.rename(temp_file, source_file)
                
                # update video model
                video_obj.video = os.path.relpath(source_file, settings.MEDIA_ROOT)
                video_obj.save()

                status = crop_frame_to_img(video_obj)
                if status == 200:
                    return JsonResponse({'message': "file upload success"}, status=200)
                elif status == 406:
                    video_obj.delete()
                    return JsonResponse({'message': 'can not open video file'}, status=406)
            except:
                video_obj.delete()
                return JsonResponse({'message': 'crop frame failed'}, status=406)

        return JsonResponse({'status': 'partial'})
    return  redirect('index')

def view(request, video_id):
    video = get_object_or_404(PanoramaVideo, id=video_id)
    frames = PanoramaImage.objects.filter(video_id=video_id).order_by('id')
    images = [{'id': frame.id, 'url': frame.image.url} for frame in frames]
    
    context = {
        'video': video,
        'images': images,
    }

    return render(request, 'map/view.html', context)

@transaction.atomic
def form_update(request):
    '''
        type info position && text value
    '''
    if request.method == 'POST':
        form = TreeInfoForm(request.POST, request.FILES)
        if form.is_valid():
            try:
                data = form.cleaned_data
                save_path = os.path.join(settings.MEDIA_ROOT, 'tree', str(data['imageId']))
                os.makedirs(save_path, exist_ok=True)
                form_obj, created = TypeInfo.objects.get_or_create(
                    x=decimal.Decimal(data['x']).quantize(decimal.Decimal("00000000.000000")) ,
                    y=decimal.Decimal(data['y']).quantize(decimal.Decimal("00000000.000000")) ,
                    z=decimal.Decimal(data['z']).quantize(decimal.Decimal("00000000.000000")) ,
                    image_id = PanoramaImage.objects.get(id=data['imageId']),
                    defaults={
                        'address': data['address'],
                        'tree_type': data['treeType'],
                        'tree_num': data['treeNum'],
                        'diameter': data['diameter'],
                        'tree_height': data['treeHeight'],
                        'crown_width': data['treeWidth'],
                        'tree_use': data['treeUse'],
                        'worker_type': data['workerType'],
                        'worker_name': data['workerName'],
                    }
                )
                if not created:
                    # 如果对象已存在，更新字段
                    field_mapping = {
                        'address': 'address',
                        'treeType': 'tree_type',
                        'treeNum': 'tree_num',
                        'diameter': 'diameter',
                        'treeHeight': 'tree_height',
                        'treeWidth': 'crown_width',
                        'treeUse': 'tree_use',
                        'workerType': 'worker_type',
                        'workerName': 'worker_name',
                    }

                    for form_field, model_field in field_mapping.items():
                        setattr(form_obj, model_field, data.get(form_field))

                    form_obj.save()

                # 定义文件字段映射： (表单字段名, 模型字段名, 文件前缀)
                image_fields = [
                    ('pre', 'front_image', 'pre'),
                    ('west', 'west_image', 'west'),
                    ('east', 'east_image', 'east'),
                    ('south', 'south_image', 'south'),
                    ('north', 'north_image', 'north'),
                ]

                for form_field, model_field, prefix in image_fields:
                    file_obj = data.get(form_field)
                    if file_obj:
                        # 构建相对路径
                        relative_path = f"{data['imageId']}/{prefix}_{file_obj.name}"
                        # 保存文件
                        getattr(form_obj, model_field).save(relative_path, file_obj, save=True)
                return JsonResponse({
                            'success': True,
                            'updatedData': {
                                'address': form_obj.address,
                                'treeType': form_obj.tree_type,
                                'treeNum': form_obj.tree_num,
                                'diameter': form_obj.diameter,
                                'treeHeight': form_obj.tree_height,
                                'treeWidth': form_obj.crown_width,
                                'treeUse': form_obj.tree_use,
                                'workerType': form_obj.worker_type,
                                'workerName': form_obj.worker_name,
                                'pre_img': form_obj.front_image.url if form_obj.front_image else None,
                                'west_img': form_obj.west_image.url if form_obj.west_image else None,
                                'east_img': form_obj.east_image.url if form_obj.east_image else None,
                                'south_img': form_obj.south_image.url if form_obj.south_image else None,
                                'north_img': form_obj.north_image.url if form_obj.north_image else None,
                                'position': {'x':form_obj.x, 'y':form_obj.y, 'z':form_obj.z}
                            }
                        }, status=200)
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)}, status=500)
        else:
            return JsonResponse({"message": "form data not valid"}, status=404)
    elif request.method == "GET":
        image_id = request.GET.get('image_id')
        if image_id:
            type_objs = TypeInfo.objects.filter(image_id=image_id)
            data = []
            for obj in type_objs:
                data.append({
                    'id': obj.id,
                    'address': obj.address,
                    'treeType': obj.tree_type,
                    'treeNum': obj.tree_num,
                    'diameter': obj.diameter,
                    'treeHeight': obj.tree_height,
                    'treeWidth': obj.crown_width,
                    'treeUse': obj.tree_use,
                    'workerName': obj.worker_name,
                    'workerType': obj.worker_type,
                    'pre_img': obj.front_image.url if obj.front_image else None,
                    'north_img': obj.north_image.url if obj.north_image else None,
                    'south_img': obj.south_image.url if obj.south_image else None,
                    'east_img': obj.east_image.url if obj.east_image else None,
                    'west_img': obj.west_image.url if obj.west_image else None,
                    'position': {'x': obj.x, 'y': obj.y, 'z': obj.z},
                })

            return JsonResponse({"data": data}, status=200)
        else:
            return JsonResponse({"message": "No image id matching"}, status=404)


def form_data(request):
    pass