/**
 * @jest-environment jsdom
 */

const script = require("../src/script")

test("", () =>
{
    let angle = script.get_angle3d([0, 1], [1, 0])
    expect(angle).toBe(90)
})