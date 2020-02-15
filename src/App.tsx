import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { usePeerConnection } from './PeerConnectionContext'
import { useOffers } from './random'
import { useFileSending } from './hooks'
import ImageViewer from './ImageViewer'

const App = () => {
  const { makeOffer, mainConnectionOpen, mainDataChannelOpen, mode, handleOffer } = usePeerConnection()
  const offers = useOffers()
  const { sendFile, file } = useFileSending()

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

      {file &&
        <ImageViewer file={file} />
      }
    </div>
  );
}

export default App;
