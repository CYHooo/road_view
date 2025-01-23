import { Vector3 } from "three";

export const video = [
    {
        name:'video',
        key: 'video',
        map: new URL('/static/map/video/temp_video_1730710601385.mp4', import.meta.url).href,
        showSwitch: true,
        position: new Vector3(0,0,0),
        interactivePoints: [
            {
                key: 'test video1',
                value: 'Test video value',
                description: 'This is video test message',
                position: new Vector3(-5,-5,0)
            }
        ],
    }
]
const img_foler = '/media/temp/temp_video_1730710601385/';

export const images = [

    {
        name: 'image1',
        key: 'image1',
        map: new URL('/static/map/img/IMG_20241115_183724_260.jpg', import.meta.url).href,
        showSwitch: true,
        position: new Vector3(0,0,0),
        interactivePoints: [
            {
                key: 'test1',
                value: 'Test value',
                description: 'This is test message',
                position: new Vector3(-5,-5,0)
            }
        ],
    },
    {
        name: 'image2',
        key: 'image2',
        map: new URL('/static/map/img/IMG_20241115_183731_671.jpg', import.meta.url).href,
        showSwitch: true,
        position: new Vector3(0,0,0),
        interactivePoints: [
            {
                key: 'test2',
                value: 'Test2 value',
                description: 'This is test2 message',
                position: new Vector3(0,0,0)
            }
        ],
    },
    {
        name: 'image3',
        key: 'image3',
        map: new URL('/static/map/img/IMG_20241115_183737_514.jpg', import.meta.url).href,
        showSwitch: true,
        position: new Vector3(0,0,0),
        interactivePoints: [
            {
                key: 'test1',
                value: 'Test value3',
                description: 'This is test3 message',
                position: new Vector3(1, 0, 1)
            }
        ],
    },
    {
        name: 'image4',
        key: 'image4',
        map: new URL('/static/map/img/IMG_20241115_183742_888.jpg', import.meta.url).href,
        showSwitch: true,
        position: new Vector3(0,0,0),
        interactivePoints: [
            {
                key: 'test1',
                value: 'Test value4',
                description: 'This is test4 message',
                position: new Vector3(1, 0, 1)
            }
        ],
    }
]