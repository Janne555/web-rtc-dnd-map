import React, { useState, useEffect } from 'react'
import './App.css'

const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }
const peerConnection = new RTCPeerConnection(configuration)
let dataChannel: RTCDataChannel | undefined = undefined

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
  })
});

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

const App = () => {
  const [sessionDescriptor, setSessionDescriptor] = useState<RTCSessionDescriptionInit>()
  const [input, setInput] = useState("")
  const [candidates, setCandidates] = useState<RTCIceCandidate[]>([])
  const [chat, setChat] = useState("")

  useEffect(() => {
    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        setCandidates(candidates.concat(event.candidate))
      }
    })
  })

  async function createOffer() {
    dataChannel = peerConnection.createDataChannel("chat")
    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    await navigator.clipboard.writeText(offer.sdp ?? "")
    setSessionDescriptor(offer)
    dataChannel.addEventListener('open', event => {
      console.log(event.type, event)
    })

    dataChannel.addEventListener('close', event => {
      console.log(event.type, event)
    })

    dataChannel.addEventListener('message', event => {
      console.log(event.data)
    })
  }

  async function handleAnswer() {
    const remoteDesc = new RTCSessionDescription({ type: 'answer', sdp: input })
    await peerConnection.setRemoteDescription(remoteDesc)
  }

  async function handleOffer() {
    peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: input }))
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    await navigator.clipboard.writeText(answer.sdp ?? "")
    setSessionDescriptor(answer)
  }

  async function handleCandidate() {
    peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(input)))
  }


  return (
    <div>
      <input onChange={e => setChat(e.target.value)} value={chat}></input>
      <button onClick={() => { dataChannel?.send(chat); setChat("") }} >send</button>
      <div className="App">
        <button onClick={createOffer}>Make offer</button>
        <textarea placeholder="SDP" value={input} onChange={e => setInput(e.target.value)} />
        <div>
          <button onClick={handleAnswer} disabled={!input}>Handle answer</button>
          <button onClick={handleOffer} disabled={!input}>Handle offer</button>
          <button onClick={handleCandidate} disabled={!input}>Handle candidate</button>
        </div>
      </div>
      <ul>
        {
          candidates.map((candidate, i) => (
            <li key={candidate.ip ?? i} onClick={async () => navigator.clipboard.writeText(JSON.stringify(candidate))}>{candidate.candidate}</li>
          ))
        }
      </ul>
    </div>
  );
}

export default App;
