# WebRTC dnd map
The idea behind this project was to display a map on one tab and control what's visible to the player's on another tab. This was done using webRTC which is possibly overkill. It uses a web socket based signaling server to initiate the connection between webRTC peers.

## How it works
One tab initates a session, acting as host and sends the ICE candidates to the signaling server. Another tab acting as client retrieves a list of hosts from the signaling server and generates a response to the ICE candidate. The client then sends a response to the host through the signaling server. After the host receives the response it establishes the peer-to-peer connection

## How it's used
The host selects an image that is shared to the client. The host can see the image through a mask that represents the fog of war on the client tab. The mask can be cleared away in desired places which in turn clears the fog of war on the client tab.
