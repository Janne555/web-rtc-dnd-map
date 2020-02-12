import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { usePeerConnection } from './PeerConnectionContext'
import { useOffers } from './random'
import { useFileSending } from './hooks'

const App = () => {
  const { peerConnection, makeOffer, mainConnectionOpen, mainDataChannelOpen, mode, handleOffer, dataChannel } = usePeerConnection()
  const offers = useOffers()
  const { sendFile, file } = useFileSending()
  const mouseDown = useRef(false)
  const { current: canvas } = useRef(document.createElement('canvas'))

  useEffect(() => {
    if (file) {
      const image = new Image
      image.onload = () => {
        const context = canvas.getContext("2d")!
        canvas.height = image.height
        canvas.width = image.width
        context.rect(0, 0, image.width, image.height)
        context.fillStyle = 'rgb(0, 0, 0)'
        context.fill()
        document.getElementById('container')?.appendChild(canvas)
        document.getElementById('container')?.appendChild(image)
      }

      image.src = URL.createObjectURL(file)
    }
  }, [file])

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener('message', event => {
        const data = JSON.parse(event.data)
        const ctx = canvas.getContext("2d")!
        ctx.clearRect(data.x - 20, data.y - 20, 40, 40)
      })
    }
  })

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      sendFile(event.target.files[0])

      const image = new Image
      image.onload = () => {

        canvas.addEventListener('mousemove', e => {
          if (mouseDown.current) {
            dataChannel?.send(JSON.stringify({ x: e.offsetX, y: e.offsetY }))
            const ctx = canvas.getContext("2d")!
            ctx.clearRect(e.offsetX - 20, e.offsetY - 20, 40, 40)
          }
        })

        canvas.addEventListener('mousedown', e => {
          mouseDown.current = true
        })

        canvas.addEventListener('mouseup', e => {
          mouseDown.current = false
        })

        const context = canvas.getContext("2d")!
        canvas.height = image.height
        canvas.width = image.width
        context.rect(0, 0, image.width, image.height)
        context.fillStyle = 'rgba(255, 0, 0, 0.3)'
        context.fill()
        document.getElementById('container')?.appendChild(canvas)
        document.getElementById('container')?.appendChild(image)
      }
      image.src = URL.createObjectURL(event.target.files[0])
    }
  }

  return (
    <div className="App">
      {mainConnectionOpen
        ? <span>Peer Connection Open</span>
        : <button disabled={Boolean(mode)} onClick={makeOffer}>Offer Connection</button>
      }
      {mainDataChannelOpen &&
        <span>Main Data Channel Open</span>
      }
      <span>{mode}</span>
      {!mainConnectionOpen &&
        <ul>
          {
            offers.map(offer => (
              <li key={offer.sdp}>
                {offer.sdp.match(/^o=.*$/m)?.join(", ") ?? "no match"}
                <button onClick={() => handleOffer(offer)}>Answer</button>
              </li>
            ))
          }
        </ul>
      }
      <input
        disabled={!mainConnectionOpen}
        type="file"
        onChange={handleFile}
      />
      <div id="container">

      </div>
    </div>
  );
}

export default App;
