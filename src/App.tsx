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

const App = () => {
  const [chat, setChat] = useState("")
  const [chats, setChats] = useState<string[]>([])

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
        setChats(prev => prev.concat(event.data))
        console.log(event.data)
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
      setChats(prev => prev.concat(event.data))
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

  return (
    <div className="App">
      <input onChange={e => setChat(e.target.value)} value={chat}></input>
      <button onClick={() => { dataChannel?.send(chat); setChat("") }} >send</button>
      <button onClick={createOffer}>Connect</button>
      <ul id="list">
        {
          chats.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))
        }
      </ul>
    </div>
  );
}

export default App;
