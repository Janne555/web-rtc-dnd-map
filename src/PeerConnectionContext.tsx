import React, { useRef, useState, useEffect, ReactNode, Children, useContext } from "react"
import { useSignaling } from "./signalingContext"

const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] }

const PeerContext = React.createContext({
  peerConnection: {} as RTCPeerConnection,
  mode: undefined as undefined | 'host' | 'client',
  mainConnectionOpen: false,
  mainDataChannelOpen: false,
  dataChannel: undefined as undefined | RTCDataChannel,
  makeOffer: {} as () => void,
  handleOffer: {} as (offer: RTCSessionDescription) => void
})

function PeerConnectionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'host' | 'client'>()
  const modeRef = useRef<'host' | 'client'>()
  const [mainConnectionOpen, setMainConnectionOpen] = useState(false)
  const [mainDataChannelOpen, setMainDataChannelOpen] = useState(false)
  const { ws, send } = useSignaling()
  const { current: peerConnection } = useRef(new RTCPeerConnection(configuration))
  const dataChannel = useRef<RTCDataChannel>()

  useEffect(() => {
    modeRef.current = mode
  })

  useEffect(addEventListeners(
    peerConnection,
    setMainConnectionOpen,
    channel => { dataChannel.current = channel },
    setMainDataChannelOpen,
    handleCandidate
  ), [])

  useEffect(() => {
    ws.addEventListener('message', handleAnswer)
    ws.addEventListener('message', event => {
      if (event.data.includes('candidate')) {
        try {
          const data = JSON.parse(event.data)
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch { }
      }
    })
  }, [])

  async function makeOffer() {
    if (mode) {
      throw Error(`wrong state to make offer: ${mode}`)
    }
    setMode('host')
    dataChannel.current = peerConnection.createDataChannel("main")

    dataChannel.current.addEventListener('open', function () {
      setMainDataChannelOpen(true)
    })

    dataChannel.current.addEventListener('close', function () {
      setMainDataChannelOpen(false)
    })

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    send(offer)
  }

  async function handleOffer(desc: RTCSessionDescription) {
    if (mode) {
      throw Error(`wrong state to handle offer: ${mode}`)
    }
    peerConnection.setRemoteDescription(desc)
    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    send(answer)
    setMode('client')
  }

  async function handleAnswer(event: MessageEvent) {
    if (event.data.includes('answer')) {
      if (modeRef.current !== 'host') {
        throw Error(`wrong state to handle anser: ${modeRef.current}`)
      }
      try {
        const data = JSON.parse(event.data)
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data))
      } catch {
      }
    }
  }

  async function handleCandidate(candidate: RTCIceCandidate) {
    send({ type: 'candidate', candidate })
  }

  return (
    <PeerContext.Provider value={{
      dataChannel: dataChannel.current,
      mainConnectionOpen,
      mainDataChannelOpen,
      mode,
      peerConnection,
      handleOffer,
      makeOffer
    }}>
      {children}
    </PeerContext.Provider>
  )
}

function usePeerConnection() {
  return useContext(PeerContext)
}

function addEventListeners(
  peerConnection: RTCPeerConnection,
  setConnectionOpen: (state: boolean) => void,
  setMainDataChannel: (channel: RTCDataChannel) => void,
  setMainDataChannelOpen: (state: boolean) => void,
  handleCandidate: (candidate: RTCIceCandidate) => void
) {
  return () => {
    peerConnection.addEventListener('connectionstatechange', function () {
      if (this.connectionState === 'connected') {
        setConnectionOpen(true)
      }
    })

    peerConnection.addEventListener('datachannel', function (event) {
      if (event.channel.label === "main") {
        setMainDataChannel(event.channel)
        event.channel.addEventListener('open', function () {
          setMainDataChannelOpen(true)
        })

        event.channel.addEventListener('close', function () {
          setMainDataChannelOpen(false)
        })
      }
    })

    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        handleCandidate(event.candidate)
      }
    })
  }
}

export {
  usePeerConnection,
  PeerConnectionProvider
}