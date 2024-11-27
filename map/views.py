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

def crop_frame_to_img(video_obj, interval=3):
    video_path = video_obj.video.path
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print('can not open video file')
        return 406
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps
    second = 0

    
    save_path = os.path.join(settings.MEDIA_ROOT, "img", str(video_obj.id))
    os.makedirs(save_path, exist_ok=True)
    
    while second < duration:
        frame_index = int(fps * second)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)

        ret, frame = cap.read()
        if not ret:
            print(f'Frame at {second} seconds could not be read')
            break

        frame_filename = f"frame_{second:04d}.jpg"
        frame_path = os.path.join(save_path, frame_filename)
        cv2.imwrite(frame_path, frame)

        PanoramaImage.objects.create(
            image=os.path.relpath(frame_path, settings.MEDIA_ROOT),
            video_id=video_obj
        )
        # save_path = os.path.join("media/img", os.path.basename(video_path).split('.mp4')[0])
        # os.makedirs(save_path, exist_ok=True)
        # cv2.imwrite(os.path.join(save_path, f"frame_{second:04d}.png"), frame)
        # print(f"save {os.path.join(save_path, f'frame_{second:04d}.png')}")
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


        temp_file_path = os.path.join('media', "temp/")
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



