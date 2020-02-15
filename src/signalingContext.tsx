import React, { useRef, useContext } from 'react'

const SignalingContext = React.createContext({
  ws: {} as WebSocket
})

function SignalingProvider({ children }: { children: React.ReactNode }) {
  const { current: ws } = useRef(new WebSocket("ws://localhost:3333"))

  return (
    <SignalingContext.Provider value={{ ws }}>
      {children}
    </SignalingContext.Provider>
  )
}

function useSignaling() {
  const { ws } = useContext(SignalingContext)

  function send(msg: { type: string, [name: string]: any }) {
    ws.send(JSON.stringify(msg))
  }

  return {
    send,
    ws
  }
}

export {
  SignalingProvider,
  useSignaling
}