from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import PanoramaImage,PanoramaVideo
import os
import aiofiles
import asyncio
import cv2
import numpy as np

# Create your views here.

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
    # left,right,up,down,front,back

    directions = {
        "r": np.array([1, 0, 0]), # X-
        "l": np.array([-1, 0, 0]),  # X+
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
    
    # stack image in one line: left, right, up, down, left, right
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
                    return JsonResponse({'message': 'can not open video file'}, status=406)
            except:
                return JsonResponse({'message': 'crop frame failed'}, status=406)

        return JsonResponse({'status': 'partial'})
    return  redirect('index')

def view(request, video_id):
    video = get_object_or_404(PanoramaVideo, id=video_id)
    frames = PanoramaImage.objects.filter(video_id=video_id).order_by('id')
    frame_urls = [frame.image.url for frame in frames]

    context = {
        'video': video,
        'frames': frame_urls,
    }

    return render(request, 'map/view.html', context)



