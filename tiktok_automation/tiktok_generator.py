import os
import requests
import math
import json

# Replace with your TikTok sandbox access token
ACCESS_TOKEN = 'act.gBuT4hmbLWGHT3uSQWwRTvMYwNUduxHHpV4Guu0cluELY90meljXRNNf4Pg9!4569.va'

# Path to your local video file
VIDEO_PATH = r'C:\Users\prabh\Desktop\Level0\Demo_V1.mp4'

def upload_video_to_tiktok(video_path):
    file_size = os.path.getsize(video_path)
    
    if file_size < 10485760:
        CHUNK_SIZE = file_size
    else:
        CHUNK_SIZE = 10485760  # 10 MB
    
    total_chunks = math.ceil(file_size / CHUNK_SIZE)

    # Prepare payload
    payload = {
        "post_info": {
            "title": "Sandbox test video upload",
            "privacy_level": "SELF_ONLY",
            "disable_comment": True,
            "disable_duet": True,
            "disable_stitch": True,
            "video_cover_timestamp_ms": 1000
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": file_size,
            "chunk_size": CHUNK_SIZE,
            "total_chunk_count": total_chunks
        }
    }
    print("Payload for TikTok init:")
    print(json.dumps(payload, indent=2))
    # Step 1: Init upload
    init_resp = requests.post(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        headers={
            'Authorization': f'Bearer {ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        },
        json=payload
    )
    
    init_data = init_resp.json()
    if 'data' not in init_data:
        print("Init upload failed:", init_data)
        return
    
    upload_url = init_data['data']['upload_url']
    publish_id = init_data['data']['publish_id']
    
    # Step 2: Upload entire file in one PUT request (if small enough)
    with open(video_path, 'rb') as f:
        video_data = f.read()
    
    put_resp = requests.put(
        upload_url,
        headers={
            'Content-Type': 'video/mp4',
            'Content-Range': f'bytes 0-{file_size - 1}/{file_size}'
        },
        data=video_data
    )
    
    if put_resp.status_code not in (200, 201):
        print("Upload failed:", put_resp.text)
        return
    
    print("Upload succeeded!")
    
    # Step 3: Check status
    status_resp = requests.post(
        'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
        headers={
            'Authorization': f'Bearer {ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        },
        json={"publish_id": publish_id}
    )
    
    print("Post status:", status_resp.json())

upload_video_to_tiktok(VIDEO_PATH)
