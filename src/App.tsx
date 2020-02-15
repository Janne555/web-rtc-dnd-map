import React, { useState, useEffect } from 'react'
import './App.css'
import { usePeerConnection } from './PeerConnectionContext'
import { useOffers } from './random'
import { useFileSending } from './hooks'
import ImageViewer from './ImageViewer'

export let brush = {
  size: 40
}

const App = () => {
  const { makeOffer, mainConnectionOpen, mainDataChannelOpen, mode, handleOffer, dataChannel } = usePeerConnection()
  const offers = useOffers()
  const { sendFile, file } = useFileSending()
  const [brushSize, setBrushSize] = useState(40)

  useEffect(() => {
    brush.size = brushSize
    dataChannel?.send(JSON.stringify({ type: 'brush-size', brushSize }))
  }, [brushSize])

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      sendFile(event.target.files[0])
    }
  }

  return (
    <div className="App" style={{ display: mode === 'client' ? 'none' : 'flex' }}>
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

      <label htmlFor="brush-size">Brush size {brushSize}</label>
      <input disabled={mode !== 'host'} id="brush-size" type="range" min={1} max={100} onChange={e => setBrushSize(Number(e.target.value))} value={brushSize} />

      {file &&
        <ImageViewer file={file} />
      }
    </div>
  );
}

export default App;
