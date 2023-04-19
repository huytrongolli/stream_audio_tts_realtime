
const EventEmitter = require('events')
const schedule     = require('node-schedule')
const express      = require('express')
const http         = require("http")
const app          = express()
const UPDATE_TIME = '* * * * * *'                 // every second
let   PACKET_NUM  = 0
const eventEmitter= new EventEmitter ()
eventEmitter.setMaxListeners(100)




app.get("/", (req,res)=>{
    res.sendFile("index.html",{root: '.'})
})

app.use('/scripts', express.static(__dirname + '/scripts/'));

const TEST_LOCAL = false
const TEST_CHAT_GPT = false
const boundary = 'this-is-my-boundary-for-js-client'
const TEXT_INVOKE = "phụ tôi viết mail"
const TEXT_EVENT = "phụ tôi viết email xin việc"
const HOST_LOCAL = 'http://localhost:8000'
const HOST_DEV = 'https://dev.mvs.maika.ai'

const http2 = require('http2')
var TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2ODE2MzI3MDksIm5iZiI6MTY4MTYzMjcwOSwianRpIjoiYTBmZGNhZjctNDk3NC00MzZkLTgyNWUtY2NiMmZmNzAzYmU4IiwiaWRlbnRpdHkiOiJ7XCJzdWJcIjogMTEzLCBcIm5hbWVcIjogXCJzdHJpbmdcIiwgXCJmaXJzdF9uYW1lXCI6IFwic3RyaW5nXCIsIFwibGFzdF9uYW1lXCI6IFwic3RyaW5nXCIsIFwiY291bnRyeVwiOiBcInN0cmluZ1wiLCBcIm9jY3VwYXRpb25cIjogXCJzdHJpbmdcIiwgXCJjaXR5XCI6IFwic3RyaW5nXCIsIFwiZW1haWxcIjogXCJodXkuZGFuZ0BvbGxpLWFpLmNvbVwiLCBcInJvbGVcIjogMSwgXCJzdGF0dXNcIjogMSwgXCJkZWZhdWx0X2xhbmd1YWdlXCI6IFwic3RyaW5nXCIsIFwiZXhwcmlyYXRpb25cIjogODY0MDAsIFwicGhvbmVfbnVtYmVyXCI6IFwiXCIsIFwiY2FsbGluZ19uYW1lXCI6IFwiSFxcdTFlYTNpIFRcXHUxZWExXCJ9IiwiZnJlc2giOmZhbHNlLCJ0eXBlIjoiYWNjZXNzIiwidXNlcl9jbGFpbXMiOnsiaHR0cHM6Ly9oYXN1cmEuaW8vand0L2NsYWltcyI6eyJ4LWhhc3VyYS1hbGxvd2VkLXJvbGVzIjpbIm1lbWJlciJdLCJ4LWhhc3VyYS11c2VyLWlkIjoxMTMsIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6Imd1ZXN0IiwieC1oYXN1cmEtcm9sZSI6Im1lbWJlciJ9fX0.PHmQeWS1_EnXhGX9hG6Ddax0tvrJiB6LRqCdqWmZrj4"
var client = http2.connect(TEST_LOCAL == true ? HOST_LOCAL : HOST_DEV)

client.on('error', (err) => {
    console.log('Client error:', err)
}).on('close', () => {
    console.log('Client Closed')
});

function create_UUID() {
    let dt = new Date().getTime();
    let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
function call_api(method, path) {
    return client.request({
        ':method': method,
        ':scheme': 'https',
        ':path': path,
        'content-type': 'multipart/form-data; boundary=' + boundary,
        'authorization': 'Bearer ' + TOKEN,
        'device-id': 'huy_device',
        'device-type': 'web',
    })
}

function send_event_common(text) {
    var req = call_api('POST', '/20221111/events')
    var metadata = JSON.stringify(
        {
            "context": [],
            "event": {
                "header": {
                    "namespace": "TextRecognizer",
                    "name": "Recognize",
                    "messageId": create_UUID(),
                    "dialogRequestId": create_UUID()
                },
                "payload": {
                    "text": text
                }
            }
        }
    );

    var data = "--this-is-my-boundary-for-js-client\r\n";
    data += 'Content-Disposition: form-data; name="metadata"\r\n';
    data += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
    data += metadata;
    data += "\r\n";
    data += "--this-is-my-boundary-for-js-client--\r\n";
    var payload1 = Buffer.concat([
        Buffer.from(data, "utf8"),
    ]);
    req.write(payload1)

    req.on('data', (m) => {
        console.log(m.toString());
    })
};
function send_event() {


    if (TEST_CHAT_GPT === true) {
        send_event_common(TEXT_INVOKE);
    }
    setTimeout(() => {
        send_event_common(TEXT_EVENT);
    }, 5000);
}

app.get("/abc", async (req,res)=>{
    res.writeHead(200,"OK")

    send_event();

    const downchannel_binary_audio = call_api('GET','/20221111/downchannel/binary-audio-data')

    downchannel_binary_audio.on('data', (m) => {
        const a = new Buffer(m, "binary");
        res.write(a);
        console.log("he he");
    })
})

// This creates a schedule to make an update event on every second
schedule.scheduleJob(UPDATE_TIME, function(){
    PACKET_NUM+=1
    eventEmitter.emit("update")
})

const server = http.createServer(app)
server.listen(3001)