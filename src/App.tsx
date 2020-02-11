import React, { useState, useEffect } from 'react'
import './App.css'

const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
const peerConnection = new RTCPeerConnection(configuration)
let dataChannel: RTCDataChannel | undefined = undefined

peerConnection.addEventListener('icecandidate', event => {
  console.log(event.type, event)
})

peerConnection.addEventListener('connectionstatechange', event => {
  console.log(event.type, event)
});

peerConnection.addEventListener('negotiationneeded', event => {
  console.log(event.type, event)
});

peerConnection.addEventListener('signalingstatechange', event => {
  // console.log(event.type, event)
});

let ws: WebSocket | undefined
let listeningToOffers = false

let readingFile = false
let fileType: string | undefined
let parts: ArrayBuffer[] = []
let file: File | undefined

function handleMessage(data: any) {
  if (data === "start") {
    readingFile = true
    return
  }

  if (readingFile && !fileType) {
    fileType = data
    return
  }

  if (data !== "done") {
    parts.push(data)
    return
  }

  if (data === "done") {
    file = new File(parts, "file", { type: fileType })
    console.log(file)
    var reader = new FileReader();
    // it's onload event and you forgot (parameters)
    reader.onload = function (e) {
      if (typeof e.target?.result !== "string") throw Error
      var image = document.createElement("img");
      // the result image data
      image.src = e.target.result;
      document.body.appendChild(image);
    }
    // you have to declare the file loading
    reader.readAsDataURL(file);
    return
  }

}

const App = () => {
  useEffect(() => {
    ws = new WebSocket("ws://localhost:3333")
    ws.addEventListener('message', msg => {
      console.log(msg)
      if (!msg.data.includes("type")) {
        return
      }

      try {
        const data = JSON.parse(msg.data)
        switch (data.type) {
          case 'offer':
            handleOffer(new RTCSessionDescription(data.offer))
            break
          case 'answer':
            if (!listeningToOffers) {
              return
            }
            handleAnswer(new RTCSessionDescription(data.answer))
            break
          case 'candidate':
            if (!listeningToOffers) {
              return
            }
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
            break
        }

      } catch (error) {
        console.error(error)
      }
    })

    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        ws?.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }))
      }
    })

    peerConnection.addEventListener('datachannel', event => {
      console.log(event.type, event)
      dataChannel = event.channel

      dataChannel.addEventListener('open', event => {
        console.log(event.type, event)
      })

      dataChannel.addEventListener('close', event => {
        console.log(event.type, event)
      })

      dataChannel.addEventListener('message', event => {
        console.log(event.data)
        handleMessage(event.data)
      })
    });
  }, [])

  async function createOffer() {
    listeningToOffers = true
    dataChannel = peerConnection.createDataChannel("chat")
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    ws?.send(JSON.stringify({ type: 'offer', offer }))
    dataChannel.addEventListener('open', event => {
      console.log(event.type, event)
    })

    dataChannel.addEventListener('close', event => {
      console.log(event.type, event)
    })

    dataChannel.addEventListener('message', event => {
      console.log(event.data)
    })

    dataChannel.addEventListener('message', event => {
      console.log(event.data)
    })
  }

  async function handleAnswer(answer: RTCSessionDescription) {
    await peerConnection.setRemoteDescription(answer)
  }

  async function handleOffer(offer: RTCSessionDescription) {
    peerConnection.setRemoteDescription(offer)
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    ws?.send(JSON.stringify({ type: 'answer', answer }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    console.log(file)
    if (file) {
      const fileReader = new FileReader()
      let offset = 0

      fileReader.addEventListener('load', e => {
        console.log(`filereader read: ${offset}`)
        if (e.target?.result && e.target.result instanceof ArrayBuffer) {
          dataChannel?.send(e.target.result)
          offset += e.target.result.byteLength
          if (offset < file.size) {
            readSlice()
          } else {
            dataChannel?.send("done")
          }
        }
      })

      const readSlice = () => {
        if (file) {
          const slice = file.slice(offset, offset + 16384)
          fileReader.readAsArrayBuffer(slice)
        }
      }

      dataChannel?.send("start")
      dataChannel?.send(file.type)
      readSlice()
    }
  }

  return (
    <div className="App">
      <input onChange={handleChange} type="file" accept="image/*"></input>
      <button>send</button>
      <button onClick={createOffer}>Connect</button>
      <canvas id="canvas" style={{ border: '1px solid black' }}>

      </canvas>
    </div>
  );
}

export default App;
