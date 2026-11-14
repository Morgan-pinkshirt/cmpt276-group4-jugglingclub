// Read Jest documentation to try to do the testing. https://jestjs.io/docs/getting-started
// To try to do some testing with DOM: https://dev.to/snowleo208/things-i-learned-after-writing-tests-for-js-and-html-page-4lja

// use of AI (ChatGpt) to understand the error and fix my test case. I described my error, or paste the error message, and tried to describe what I was trying to achieve instead of pasting my code to its chatbox. - November 13th, 2026


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
    document.getElementById("options").value = 'p1_8_air';
    const svgStill = document.getElementById("svg_still");
    const svgMov = document.getElementById("svg_moving");
    const canvasStill = document.getElementById("canvas_still");
    const canvasMov = document.getElementById('canvas_moving');
    
    expect(button).not.toBeNull();
    expect(svgMov).not.toBeNull();
    expect(canvasMov).not.toBeNull();
    expect(svgStill).not.toBeNull();
    expect(canvasStill).not.toBeNull();
    button.click();    
    
    const testImg = document.getElementById("img");
    expect(testImg.src).toContain('img/p1_8_air.png');
    expect(document.getElementById("canvas_still").style.display).toBe('block');
    expect(document.getElementById('canvas_moving').style.display).toBe('block');
    expect(document.getElementById("svg_still").style.display).toBe('none');
    expect(document.getElementById('svg_moving').style.display).toBe('none');


})