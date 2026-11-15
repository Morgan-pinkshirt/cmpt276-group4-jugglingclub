// Read Jest documentation to try to do the testing. https://jestjs.io/docs/getting-started
// To try to do some testing with DOM: https://dev.to/snowleo208/things-i-learned-after-writing-tests-for-js-and-html-page-4lja

// use of AI (ChatGpt) to understand errors and fix my first test case - 'Display mode after user selection' - because it was my first time writting test cases using Jest. I described my error, or paste the error message, and tried to describe what I was trying to achieve instead of pasting my code to its chatbox. - November 13th, 2026


// required to install for testing (https://jestjs.io/docs/getting-started): npm install --save-dev jest
// required to install for DOM manipulation (https://jestjs.io/docs/tutorial-jquery): install jsdom 
// required to install for usages of Canvas (https://www.npmjs.com/package/canvas): install npm install canvas for testing

const fs = require('fs');
const path = require('path');


beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../../../../../main/resources/templates/2d-sim/2dsim.html'), 'utf8');

    document.documentElement.innerHTML = html;
    jest.resetModules();

    require('../../../../../main/resources/static/2d-sim/moving.js');
    require('../../../../../main/resources/static/2d-sim/script.js');
    require('../../../../../main/resources/static/2d-sim/speed.js');
    require('../../../../../main/resources/static/2d-sim/sim.js');
    require('../../../../../main/resources/static/2d-sim/controls.js');
})

test('Display mode after user selection', () => {
    const button = document.getElementById("view-button");
    const svgStill = document.getElementById("svg_still");
    const svgMov = document.getElementById("svg_moving");
    const canvasStill = document.getElementById("canvas_still");
    const canvasMov = document.getElementById('canvas_moving');
    const option = document.getElementById("options");
    const img = document.getElementById("img");

    expect(button).not.toBeNull();
    expect(svgMov).not.toBeNull();
    expect(canvasMov).not.toBeNull();
    expect(svgStill).not.toBeNull();
    expect(canvasStill).not.toBeNull();

    // Test function draw() from the clickedButton, 3 tests
    // Select 1 mode
    option.value = 'p1_8_air';
    button.click();    

    expect(img.src).toContain('img/p1_8_air.png');
    // Ensure the Canvas club is displayed and the SVG club is hidden
    expect(canvasStill.style.display).toBe('block');
    expect(canvasMov.style.display).toBe('block');
    expect(svgStill.style.display).toBe('none');
    expect(svgMov.style.display).toBe('none');

    // Select a 2nd mode from a different page - I chose one that has a ' in the name because it might create issues when getting the value
    option.value = `p13_23_marvin's_mode`;
    button.click();    

    expect(img.src).toContain(`p13_23_marvin's_mode`);
    // Ensure the Canvas club is displayed and the SVG club is hidden
    expect(canvasStill.style.display).toBe('block');
    expect(canvasMov.style.display).toBe('block');
    expect(svgStill.style.display).toBe('none');
    expect(svgMov.style.display).toBe('none');
})

test('Change the color for the handle and body', () => {
    const slider = document.getElementById("colourSlider");
    const bodyButton = document.getElementById("bodyButton");
    const handleButton = document.getElementById("handleButton");

    const club = document.getElementById("clubBody");
    const handle = document.getElementById("clubHandle");
    const clubMov = document.getElementById("BodyMov");
    const handleMov = document.getElementById("HandleMov");

    const svgStill = document.getElementById("svg_still");
    const svgMov = document.getElementById("svg_moving");
    const canvasStill = document.getElementById("canvas_still");
    const canvasMov = document.getElementById('canvas_moving');
    
    expect(slider).not.toBeNull();
    expect(bodyButton).not.toBeNull();
    expect(handleButton).not.toBeNull();
    expect(svgMov).not.toBeNull();
    expect(canvasMov).not.toBeNull();
    expect(svgStill).not.toBeNull();
    expect(canvasStill).not.toBeNull();

    // Change the color for the handle - test function for handleButton
    handleButton.click();
    // Use of AI (ChatGPT) to check for the classList. There were no information online about it except for a Mock test
    expect(handleButton.classList.contains("active")).toBe(true);
    expect(bodyButton.classList.contains("active")).toBe(false);
    // Use of AI (ChatGPT) to figure out how to call a function that was set from an input rather than a click
    // test function from slider input which is calling changeColor()
    slider.value = "36";    
    slider.dispatchEvent(new Event("input"));
    expect(handle.getAttribute("fill")).toBe('hsl(36, 100%, 50%)');
    expect(handleMov.getAttribute("fill")).toBe('hsl(36, 100%, 50%)');
    expect(club.getAttribute("fill")).toBe('grey');
    expect(clubMov.getAttribute("fill")).toBe("grey");

    // Change the color for the body - test function for bodyButton
    bodyButton.click();
    expect(bodyButton.classList.contains("active")).toBe(true);
    expect(handleButton.classList.contains("active")).toBe(false);
    // test function from slider input which is calling changeColor()
    slider.value = "187";    
    slider.dispatchEvent(new Event("input"));
    expect(club.getAttribute("fill")).toBe('hsl(187, 100%, 50%)');
    expect(clubMov.getAttribute("fill")).toBe('hsl(187, 100%, 50%)');
    expect(handle.getAttribute("fill")).toBe('hsl(36, 100%, 50%)');
    expect(handleMov.getAttribute("fill")).toBe('hsl(36, 100%, 50%)');

    // Change the color for the handle - test function for handleButton
    handleButton.click();
    expect(handleButton.classList.contains("active")).toBe(true);
    expect(bodyButton.classList.contains("active")).toBe(false);
    // test function from slider input which is calling changeColor()
    slider.value = "329";    
    slider.dispatchEvent(new Event("input"));
    expect(handle.getAttribute("fill")).toBe('hsl(329, 100%, 50%)');
    expect(handleMov.getAttribute("fill")).toBe('hsl(329, 100%, 50%)');
    expect(club.getAttribute("fill")).toBe('hsl(187, 100%, 50%)');
    expect(clubMov.getAttribute("fill")).toBe("hsl(187, 100%, 50%)");
    
    // Ensure the SVG club is displayed and the Canvas club is hidden
    // Test function changeVisibilityColor()
    expect(canvasStill.style.display).toBe('none');
    expect(canvasMov.style.display).toBe('none');
    expect(svgStill.style.display).toBe('block');
    expect(svgMov.style.display).toBe('block');
})

test('Change the speed of the moving club', () => {
    // Test for function update()
    const control = document.getElementById("moving-speed");
    const label = document.getElementById("moving-speed-value");
    const club = document.getElementById("clubDivision");

    expect(control).not.toBeNull();
    expect(label).not.toBeNull();
    expect(club).not.toBeNull();

    // Decrease speed of 1.0x to speed of 0.2x
    control.value = "20";    
    control.dispatchEvent(new Event("input"));
    expect(window.jestersSpeed).toBe(0.2);
    expect(label.innerHTML).toBe('0.2×')
    expect(club.style.animationPlayState).toBe('running');
    expect(club.style.animationDuration).toBe('10s');

    // Increase speed of 0.2x to 4.0x - type is range so the slider won't be able to have any value greater than it
    control.value = "400";    
    control.dispatchEvent(new Event("input"));
    expect(window.jestersSpeed).toBe(4);
    expect(label.innerHTML).toBe('4.0×')
    expect(club.style.animationPlayState).toBe('running');
    expect(club.style.animationDuration).toBe('0.5s');

    // Test for speed of 3.9x, the case right before - I wanted to test with the value 399, but from the HTML, the step is by increment of 10
    control.value = "390";    
    control.dispatchEvent(new Event("input"));
    expect(window.jestersSpeed).toBe(3.9);
    expect(label.innerHTML).toBe('3.9×')
    expect(club.style.animationPlayState).toBe('running');
    expect(club.style.animationDuration).toBe('0.5128205128205129s');

    // Test for speed of 0
    control.value = "0";    
    control.dispatchEvent(new Event("input"));
    expect(window.jestersSpeed).toBe(0);
    expect(label.innerHTML).toBe('0.0×')
    expect(club.style.animationPlayState).toBe('paused');

    // Test for speed of 0.1x, the case right before
    control.value = "10";
    control.dispatchEvent(new Event("input"));
    expect(window.jestersSpeed).toBe(0.1);
    expect(label.innerHTML).toBe('0.1×')
    expect(club.style.animationPlayState).toBe('running');
    expect(club.style.animationDuration).toBe('20s');
})

// The input is a slider, I cannot choose a value under 0 and above 100
test('Change the brightness of the moving club', () => {
    const visual = document.getElementById("moving-visual");
    const brightness = document.getElementById("moving-brightness");
    const brightOutput = document.getElementById("moving-brightness-value");

    expect(visual).not.toBeNull();
    expect(brightness).not.toBeNull();
    expect(brightOutput).not.toBeNull();

    // Test brightness of 30%
    brightness.value = "30";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0.3');
    expect(brightOutput.innerHTML).toBe("30%");

    // Test brightness of 0%
    brightness.value = "0";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0');
    expect(brightOutput.innerHTML).toBe('0%');

    // Test brightness of 0.1%
    brightness.value = "1";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0.01');
    expect(brightOutput.innerHTML).toBe('1%');

    // Test brightness of 100%
    brightness.value = "100";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('1');
    expect(brightOutput.innerHTML).toBe('100%');

    // Test brightness of 99.9%
    brightness.value = "99";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0.99');
    expect(brightOutput.innerHTML).toBe('99%');
})

// The input is a slider, I cannot choose a value under 0 and above 100
test('Change the brightness of the static club', () => {
    const visual = document.getElementById("static-visual");
    const brightness = document.getElementById("static-brightness");
    const brightOutput = document.getElementById("static-brightness-value");

    expect(visual).not.toBeNull();
    expect(brightness).not.toBeNull();
    expect(brightOutput).not.toBeNull();

    // Test brightness of 30%
    brightness.value = "30";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0.3');
    expect(brightOutput.innerHTML).toBe('30%');

    // Test brightness of 0%
    brightness.value = "0";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0');
    expect(brightOutput.innerHTML).toBe('0%');

    // Test brightness of 0.1%
    brightness.value = "1";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0.01');
    expect(brightOutput.innerHTML).toBe('1%');

    // Test brightness of 100%
    brightness.value = "100";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('1');
    expect(brightOutput.innerHTML).toBe('100%');
     
    // Test brightness of 99.9%
    brightness.value = "99";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe('0.99');
    expect(brightOutput.innerHTML).toBe('99%');
})

test('Change the saturation of the moving club', () => {
    const visual = document.getElementById("moving-visual");
    const saturation = document.getElementById("moving-saturation");;
    const satOutput = document.getElementById("moving-saturation-value");

    expect(visual).not.toBeNull();
    expect(saturation).not.toBeNull();
    expect(satOutput).not.toBeNull();

    // Test saturation of 30%
    saturation.value = "30";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0.3');
    expect(satOutput.innerHTML).toBe('30%');

    // Test saturation of 0%
    saturation.value = "0";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0');
    expect(satOutput.innerHTML).toBe('0%');

    // Test saturation of 0.1%
    saturation.value = "1";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0.01');
    expect(satOutput.innerHTML).toBe('1%');

    // Test saturation of 100%
    saturation.value = "100";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('1');
    expect(satOutput.innerHTML).toBe('100%');

    // Test saturation of 99.9%
    saturation.value = "99";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0.99');
    expect(satOutput.innerHTML).toBe('99%');
})

test('Change the saturation of the static club', () => {
    const visual = document.getElementById("static-visual");
    const saturation = document.getElementById("static-saturation");
    const satOutput = document.getElementById("static-saturation-value");

    expect(visual).not.toBeNull();
    expect(saturation).not.toBeNull();
    expect(satOutput).not.toBeNull();

    // Test saturation of 30%
    saturation.value = "30";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0.3');
    expect(satOutput.innerHTML).toBe('30%');

    // Test saturation of 0%
    saturation.value = "0";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0');
    expect(satOutput.innerHTML).toBe('0%');

    // Test saturation of 0.1%
    saturation.value = "1";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0.01');
    expect(satOutput.innerHTML).toBe('1%');

    // Test saturation of 100%
    saturation.value = "100";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('1');
    expect(satOutput.innerHTML).toBe('100%');

    // Test saturation of 99.9%
    saturation.value = "99";    
    saturation.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-saturation")).toBe('0.99');
    expect(satOutput.innerHTML).toBe('99%');
})

test('Testing the Zoom on the moving club', () => {
    const movingZoomOut = document.getElementById("moving-zoom-out");
    const movingZoomIn = document.getElementById("moving-zoom-in");
    const movingZoomValue = document.getElementById("moving-zoom-value");
    const movingClub = document.getElementById("clubDivision");

    expect(movingZoomOut).not.toBeNull();
    expect(movingZoomIn).not.toBeNull();
    expect(movingZoomValue).not.toBeNull();
    expect(movingClub).not.toBeNull();
    // added the DOMContentLoaded otherwise the test fails. Everything in the controls.js file is inside it
    document.addEventListener("DOMContentLoaded", function () {
        // testing zoom out
        movingZoomOut.click();
        expect(movingClub.style.getPropertyValue("--preview-zoom")).toBe('0.75');
        expect(movingZoomValue.innerHTML).toBe('75%');
        expect(movingZoomOut).toBeDisabled();
        expect(movingZoomIn).not.toBeDisabled();

        // can't try to zoom out more because the button is disabled
        // test zoom in
        movingZoomIn.click();
        expect(movingClub.style.getPropertyValue("--preview-zoom")).toBe('1');
        expect(movingZoomValue.innerHTML).toBe('100%');
        expect(movingZoomIn).not.toBeDisabled();
        expect(movingZoomOut).not.toBeDisabled();

        // test zoom in
        movingZoomIn.click();
        expect(movingClub.style.getPropertyValue("--preview-zoom")).toBe('1.25');
        expect(movingZoomValue.innerHTML).toBe('125%');
        expect(movingZoomIn).toBeDisabled();
        expect(movingZoomOut).not.toBeDisabled();
    })

})

test('Testint the Zoom on the static club', () => {
    const staticZoomOut = document.getElementById("static-zoom-out");
    const staticZoomIn = document.getElementById("static-zoom-in");
    const staticZoomValue = document.getElementById("static-zoom-value");
    const staticClub = document.getElementById("static-transform");

    expect(staticZoomOut).not.toBeNull();
    expect(staticZoomIn).not.toBeNull();
    expect(staticZoomValue).not.toBeNull();
    expect(staticClub).not.toBeNull();
    // added the DOMContentLoaded otherwise the test fails. Everything in the controls.js file is inside it
    document.addEventListener("DOMContentLoaded", function () {
        // testing zoom out
        staticZoomOut.click();
        expect(staticClub.style.getPropertyValue("--preview-zoom")).toBe('0.75');
        expect(staticZoomValue.innerHTML).toBe('75%');
        expect(staticZoomOut).toBeDisabled();
        expect(staticZoomIn).not.toBeDisabled();

        // can't try to zoom out more because the button is disabled
        // test zoom in
        staticZoomIn.click();
        expect(staticClub.style.getPropertyValue("--preview-zoom")).toBe('1');
        expect(staticZoomValue.innerHTML).toBe('100%');
        expect(staticZoomIn).not.toBeDisabled();
        expect(staticZoomOut).not.toBeDisabled();

        // test zoom in
        staticZoomIn.click();
        expect(staticClub.style.getPropertyValue("--preview-zoom")).toBe('1.25');
        expect(staticZoomValue.innerHTML).toBe('125%');
        expect(staticZoomIn).toBeDisabled();
        expect(staticZoomOut).not.toBeDisabled();
    })
})

test('Test the orientation of the static club', () => {
    const rotateLeft = document.getElementById("static-rotate-left");
    const rotateRight = document.getElementById("static-rotate-right");
    const resetOrientation = document.getElementById("static-reset-orientation");
    const staticClub = document.getElementById("static-transform");

    expect(rotateLeft).not.toBeNull();
    expect(rotateRight).not.toBeNull();
    expect(resetOrientation).not.toBeNull();
    expect(staticClub).not.toBeNull();

    document.addEventListener("DOMContentLoaded", function () {
        // test left rotation - rotate 90 deg each time
        // 1/4 rotation to the left
        rotateLeft.click();
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('270');
        // 1/2 rotation
        rotateLeft.click();
        // 3/4 rotation to the left
        rotateLeft.click();
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('90');
        // full rotation
        rotateLeft.click();
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('0');

        // test right rotation - rotate 90 deg each time
        // 1/4 rotation to the right
        rotateRight.click();
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('90');
        // 1/2 rotation
        rotateRight.click();
        // 3/4 rotation to the right
        rotateRight.click();
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('270');
        // full rotation
        rotateRight.click();
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('0');

        // test reset orientation
        rotateLeft.click();
        resetOrientation.click();
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('0');
    })
})
// test resetSlider
test('Reset to default view', () => {
    const slider = document.getElementById("colourSlider"); // potentially fix in js
    const clubBody = document.getElementById("clubBody");
    const clubHandle = document.getElementById("clubHandle");
    const bodyMov = document.getElementById("BodyMov");
    const handleMov = document.getElementById("HandleMov");
    const option = document.getElementById("options");
    const img = document.getElementById("img");
    const button = document.getElementById("view-button");
    // const modeName = document.getElementById("mode_name");
    const svgMoving = document.getElementById("svg_moving");
    const svgStill = document.getElementById("svg_still");
    const canvasMoving = document.getElementById("canvas_moving");
    const canvasStill = document.getElementById("canvas_still");
    const resetButton = document.getElementById("reset-simulator");
    const control = document.getElementById("moving-speed");
    const label = document.getElementById("moving-speed-value");
    const staticClub = document.getElementById("static-transform");
    const staticZoomOut = document.getElementById("static-zoom-out");
    const staticZoomIn = document.getElementById("static-zoom-in");
    const staticZoomValue = document.getElementById("static-zoom-value");
    const movingZoomOut = document.getElementById("static-zoom-out");
    const movingZoomIn = document.getElementById("static-zoom-in");
    const movingZoomValue = document.getElementById("moving-zoom-value");
    const movingClub = document.getElementById("clubDivision");
    const rotateLeft = document.getElementById("static-rotate-left");
    const visualMov = document.getElementById("moving-visual");
    const brightnessMov = document.getElementById("moving-brightness");
    const brightOutputMov = document.getElementById("moving-brightness-value");
    const visualStatic = document.getElementById("static-visual");
    const brightnessStatic = document.getElementById("static-brightness");
    const brightOutputStatic = document.getElementById("static-brightness-value");
    const saturationMov = document.getElementById("moving-saturation");;
    const satOutputMov = document.getElementById("moving-saturation-value");
    const saturationStatic = document.getElementById("static-saturation");
    const satOutputStatic = document.getElementById("static-saturation-value");


    expect(slider).not.toBeNull();
    expect(clubBody).not.toBeNull();
    expect(clubHandle).not.toBeNull();
    expect(bodyMov).not.toBeNull();
    expect(handleMov).not.toBeNull();
    expect(option).not.toBeNull();
    expect(img).not.toBeNull();
    expect(button).not.toBeNull();

    expect(svgMoving).not.toBeNull();
    expect(svgStill).not.toBeNull();
    expect(canvasMoving).not.toBeNull();
    expect(canvasStill).not.toBeNull();
    expect(resetButton).not.toBeNull();
    expect(staticClub).not.toBeNull();

    expect(control).not.toBeNull();
    expect(label).not.toBeNull();

    expect(staticZoomIn).not.toBeNull();
    expect(staticZoomOut).not.toBeNull();
    expect(staticZoomValue).not.toBeNull();
    expect(movingZoomIn).not.toBeNull();
    expect(movingZoomOut).not.toBeNull();
    expect(movingZoomValue).not.toBeNull();
    expect(movingClub).not.toBeNull();
    expect(rotateLeft).not.toBeNull();
    
    expect(visualMov).not.toBeNull();
    expect(brightnessMov).not.toBeNull();
    expect(brightOutputMov).not.toBeNull();
    expect(visualStatic).not.toBeNull();
    expect(brightnessStatic).not.toBeNull();
    expect(brightOutputStatic).not.toBeNull();

    expect(saturationMov).not.toBeNull();
    expect(satOutputMov).not.toBeNull();
    expect(saturationStatic).not.toBeNull();
    expect(satOutputStatic).not.toBeNull();

    // change the handle color
    handleButton.click();
    slider.value = "20";    
    slider.dispatchEvent(new Event("input"));

    // change the body color
    bodyButton.click();
    slider.value = "145";    
    slider.dispatchEvent(new Event("input"));

    // Increase the speed of the moving club
    control.value = "250";    
    control.dispatchEvent(new Event("input"));

    // lower the brightness and saturation of the moving club
    brightnessMov.value = "10";    
    brightnessMov.dispatchEvent(new Event("input"));
    saturationMov.value = "0";    
    saturationMov.dispatchEvent(new Event("input"));

    // lower the brightness and saturation of the moving club
    brightnessStatic.value = "50";    
    brightnessStatic.dispatchEvent(new Event("input"));
    saturationStatic.value = "30";    
    saturationStatic.dispatchEvent(new Event("input"));

    // Zoom in on the moving club
    movingZoomIn.click();

    // Zoom out on the static club
    staticZoomOut.click();

    // rotate club to the left
    rotateLeft.click();

    document.addEventListener("DOMContentLoaded", function () {
        resetButton.click();
        // reset the color of the handle and body
        expect(handle.getAttribute("fill")).toBe('white');
        expect(handleMov.getAttribute("fill")).toBe('white');
        expect(club.getAttribute("fill")).toBe('grey');
        expect(clubMov.getAttribute("fill")).toBe("grey");
        expect(canvasStill.style.display).toBe('none');
        expect(canvasMov.style.display).toBe('none');
        expect(svgStill.style.display).toBe('block');
        expect(svgMov.style.display).toBe('block');

        // reset speed
        expect(window.jestersSpeed).toBe(1);
        expect(label.innerHTML).toBe('1.0×')
        expect(clubMov.style.animationPlayState).toBe('running');
        expect(clubMov.style.animationDuration).toBe('1s');

        // reset brightness and saturation for the moving club
        expect(visualMov.style.getPropertyValue("--visual-brightness")).toBe('1.0');
        expect(brightOutputMov.innerHTML).toBe("100%");
        expect(visualMov.style.getPropertyValue("--visual-saturation")).toBe('1.0');
        expect(satOutputMov.innerHTML).toBe("100%");

        // reset brightness and saturation for the static club
        expect(visualStatic.style.getPropertyValue("--visual-brightness")).toBe('1.0');
        expect(brightOutputStatic.innerHTML).toBe("100%");
        expect(visualStatic.style.getPropertyValue("--visual-saturation")).toBe('1.0');
        expect(satOutputStatic.innerHTML).toBe("100%");

        // reset zoom on the moving club
        expect(movingClub.style.getPropertyValue("--preview-zoom")).toBe('1');
        expect(movingZoomValue.innerHTML).toBe('100%');
        expect(movingZoomIn).not.toBeDisabled();
        expect(movingZoomOut).not.toBeDisabled();

        // reset zoom on the static club
        expect(staticClub.style.getPropertyValue("--preview-zoom")).toBe('1');
        expect(staticZoomValue.innerHTML).toBe('100%');
        expect(staticZoomIn).not.toBeDisabled();
        expect(staticZoomOut).not.toBeDisabled();

        // reset the orientation
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('0');



        // Change the color to a mode and reset
        option.value = 'p1_8_air';
        button.click();  
        expect(img.src).toContain('img/p1_8_air.png');

        resetButton.click();
        // reset the color of the handle and body
        expect(handle.getAttribute("fill")).toBe('white');
        expect(handleMov.getAttribute("fill")).toBe('white');
        expect(club.getAttribute("fill")).toBe('grey');
        expect(clubMov.getAttribute("fill")).toBe("grey");

        // reset speed
        expect(window.jestersSpeed).toBe(1);
        expect(label.innerHTML).toBe('1.0×')
        expect(clubMov.style.animationPlayState).toBe('running');
        expect(clubMov.style.animationDuration).toBe('1s');

        // reset brightness and saturation for the moving club
        expect(visualMov.style.getPropertyValue("--visual-brightness")).toBe('1.0');
        expect(brightOutputMov.innerHTML).toBe("100%");
        expect(visualMov.style.getPropertyValue("--visual-saturation")).toBe('1.0');
        expect(satOutputMov.innerHTML).toBe("100%");

        // reset brightness and saturation for the static club
        expect(visualStatic.style.getPropertyValue("--visual-brightness")).toBe('1.0');
        expect(brightOutputStatic.innerHTML).toBe("100%");
        expect(visualStatic.style.getPropertyValue("--visual-saturation")).toBe('1.0');
        expect(satOutputStatic.innerHTML).toBe("100%");

        // reset zoom on the moving club
        expect(movingClub.style.getPropertyValue("--preview-zoom")).toBe('1');
        expect(movingZoomValue.innerHTML).toBe('100%');
        expect(movingZoomIn).not.toBeDisabled();
        expect(movingZoomOut).not.toBeDisabled();

        // reset zoom on the static club
        expect(staticClub.style.getPropertyValue("--preview-zoom")).toBe('1');
        expect(staticZoomValue.innerHTML).toBe('100%');
        expect(staticZoomIn).not.toBeDisabled();
        expect(staticZoomOut).not.toBeDisabled();

        // reset the orientation
        expect(staticClub.style.getPropertyValue("--static-angle")).toBe('0');
    })
})