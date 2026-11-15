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
    require('../../../../../main/resources/static/2d-sim/speed.js')
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
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0.3);
    expect(brightOutput.innerHTML).toBe('30%');

    // Test brightness of 0%
    brightness.value = "0";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0);
    expect(brightOutput.innerHTML).toBe('0%');

    // Test brightness of 100%
    brightness.value = "100";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(100);
    expect(brightOutput.innerHTML).toBe('100%');
})

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
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0.3);
    expect(brightOutput.innerHTML).toBe('30%');

    // Test brightness of 0%
    brightness.value = "0";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0);
    expect(brightOutput.innerHTML).toBe('0%');

    // Test brightness of 100%
    brightness.value = "100";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(100);
    expect(brightOutput.innerHTML).toBe('100%');
})

test('Change the saturation of the moving club', () => {
    const visual = document.getElementById("moving-visual");
    const saturation = document.getElementById("moving-saturation");;
    const satOutput = document.getElementById("moving-saturation-value");

    expect(visual).not.toBeNull();
    expect(saturation).not.toBeNull();
    expect(satOutput).not.toBeNull();

    // Test saturation of 30%
    brightness.value = "30";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0.3);
    expect(brightOutput.innerHTML).toBe('30%');

    // Test saturation of 0%
    brightness.value = "0";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0);
    expect(brightOutput.innerHTML).toBe('0%');

    // Test saturation of 100%
    brightness.value = "100";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(100);
    expect(brightOutput.innerHTML).toBe('100%');
})

test('Change the brightness of the static club', () => {
    const visual = document.getElementById("static-visual");
    const saturation = document.getElementById("static-saturation");
    const satOutput = document.getElementById("static-saturation-value");

    expect(visual).not.toBeNull();
    expect(saturation).not.toBeNull();
    expect(satOutput).not.toBeNull();

    // Test saturation of 30%
    brightness.value = "30";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0.3);
    expect(brightOutput.innerHTML).toBe('30%');

    // Test saturation of 0%
    brightness.value = "0";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(0);
    expect(brightOutput.innerHTML).toBe('0%');

    // Test saturation of 100%
    brightness.value = "100";    
    brightness.dispatchEvent(new Event("input"));
    expect(visual.style.getPropertyValue("--visual-brightness")).toBe(100);
    expect(brightOutput.innerHTML).toBe('100%');
})