Our juggling club simulation, named The Jester Club, allows jugglers to simulate their props. Furthermore, it includes features such as changing the color, the brightness, the saturation… The user can also save their work to reopen it at a later time. Additionally, that saved file can be downloaded and shared with other users who will be able to open it on their account.

The application is a maven project designed to be hosted on render.com using dockerfile the url: https://cmpt276-group4-jugglingclub.onrender.com 
All features except the 3D simulation have been covered by automated tests, and all tests currently pass. They can be found in src/test/jugglingclub. While time constraints prevented us from writing automated test scripts for the 3D simulator in this iteration, all 3D functionalities inherently require visual testing rather than standard unit assertions—as shader behavior, lighting, color saturation, and 3D spatial rendering can only be accurately verified through direct visual inspection. Accordingly, every feature of the 3D simulation was thoroughly manually tested across different effects and configurations to ensure smooth, artifact-free rendering.

AI Disclosure:
Some AI was used to create this project.
Shader was used for the effects in 3D simulator so that png can wrap over the product
AI used to figure out how to convert the 2D project to a 3D project. Therefore, to send key value and receive value between both simulators. We also used AI in the speed.js file for 2d sim, to create a slider to control the speed of rotating 2D club. Thanks to it, we discovered that the Brevo API can be used for email-based password recovery. AI was used for some of the testing.
