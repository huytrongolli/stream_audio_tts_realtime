var input_MP3_Bytes = []; var mediaSource; var sourceBuffer;
var is_FirstAppend = true; //# for setting up MSE if first append.

var mimeCodec = 'audio/mpeg;'; //# tested on Chrome browser only
//var mimeCodec = 'audio/mpeg; codecs="mp3"';  //# untested.. maybe needed by other browsers?

//# for audio tag reference
var myAudio = document.getElementById('audioMSE');
myAudio.play(); //# start conveyor belt (to receive incoming bytes)

//# load some input MP3 bytes for MSE
var fileURL = "https://dl.espressif.com/dl/audio/gs-16b-2c-44100hz.mp3"; //"6.mp3"
load_MP3( fileURL );

function load_MP3( filename )
{
    var oReq = new XMLHttpRequest();
    oReq.open("GET", filename, true);
    oReq.responseType = "arraybuffer";
    oReq.addEventListener('loadend', on_MP3isLoaded  );
    oReq.send(null);
}




// Send downchannel connect


function on_MP3isLoaded()
{
    input_MP3_Bytes = new Uint8Array( this.response ); //# fill the byte array

    if (is_FirstAppend == true)
    {
        console.log( "MSE support : " + MediaSource.isTypeSupported(mimeCodec) );
        makeMSE(); is_FirstAppend = false;
    }
    else {
        console.log("a");
        console.log(input_MP3_Bytes);
        console.log("b");
        sourceBuffer.appendBuffer( input_MP3_Bytes );

        //write source here

        // const getPost = () => {
        //     fetch(`http://localhost:3001/abc`)
        //         .then(response => console.log(response))
        //         .then(data => sourceBuffer.appendBuffer( data ));
        //
        // };
        //
        // getPost();

        // sourceBuffer.appendBuffer( data ));

    }
}

function makeMSE ( )
{
    if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec) )
    {
        mediaSource = new MediaSource;
        myAudio.src = URL.createObjectURL( mediaSource );
        mediaSource.addEventListener( "sourceopen", mse_sourceOpen );
    }
    else { console.log("## Unsupported MIME type or codec: " + mimeCodec); }
}

function mse_sourceOpen()
{
    sourceBuffer = mediaSource.addSourceBuffer( mimeCodec );
    sourceBuffer.addEventListener( "updateend", mse_updateEnd );

    //sourceBuffer.mode = "sequence";
    sourceBuffer.appendBuffer( input_MP3_Bytes );

};

function mse_updateEnd()
{
    //# what to do after feeding-in the bytes...?
    //# 1) Here you could update (overwrite) same "input_MP3_Bytes" array with new GET request
    //# 2) Or below is just a quick test... endless looping

    //# 1) load another MP3 file
    fileURL = "https://dl.espressif.com/dl/audio/gs-16b-2c-44100hz.mp3";
    load_MP3( fileURL );

    //# 2) re-feed same bytes for endless looping
    //sourceBuffer.appendBuffer( input_MP3_Bytes );

    //mediaSource.endOfStream(); //# close stream to close audio
    //console.log("mediaSource.readyState : " + mediaSource.readyState); //# is ended
}