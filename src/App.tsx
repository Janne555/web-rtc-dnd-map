import React, { useState, useEffect } from 'react'
import './App.css'
import { usePeerConnection } from './PeerConnectionContext'
import { useOffers } from './random'

const App = () => {
  const { peerConnection, makeOffer, mainConnectionOpen, mainDataChannelOpen, mode, handleOffer } = usePeerConnection()
  const offers = useOffers()

  useEffect(() => {
    if (mainConnectionOpen) {
      peerConnection.createDataChannel("image")
    }
  })

  return (
    <div className="App">
      {mainConnectionOpen
        ? <span>Peer Connection Open</span>
        : <button disabled={Boolean(mode)} onClick={makeOffer}>Offer Connection</button>
      }
      {mainDataChannelOpen &&
        <span>Main Data Channel Open</span>
      }
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
      <canvas id="canvas" style={{ border: '1px solid black' }}>

      </canvas>
    </div>
  );
}

export default App;
