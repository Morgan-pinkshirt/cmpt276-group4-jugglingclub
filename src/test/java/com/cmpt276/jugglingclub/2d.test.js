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

    // Change the color for the hangle
    slider.value = "hsl(0, 99%, 32%)";
    handleButton.click();    
    slider.click();
    expect(handle.attributes).toContain("hsl(0, 99%, 32%)");
    expect(handleMov.attributes).toContain("hsl(0, 99%, 32%)");
    expect(club.attributes).toContain("white");
    expect(clubMov.attributes).toContain("white");

    // Change the color for the body
    slider.value = "hsl(187, 100%, 69%)";
    bodyButton.click();    
    slider.click();
    expect(club.attributes).toContain("hsl(187, 100%, 69%)");
    expect(clubMov.attributes).toContain("hsl(187, 100%, 69%)");
    expect(handle.attributes).toContain("hsl(0, 99%, 32%)");
    expect(handleMov.attributes).toContain("hsl(0, 99%, 32%)");
    
    // Ensure the SVG club is displayed and the Canvas club is hidden
    expect(canvasStill.style.display).toBe('block');
    expect(canvasMov.style.display).toBe('block');
    expect(svgStill.style.display).toBe('none');
    expect(svgMov.style.display).toBe('none');
})