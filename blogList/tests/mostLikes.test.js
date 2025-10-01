const { test, describe } = require("node:test");
const assert = require("node:assert");
const listHelper = require("../utils/list_helper");

describe("Most Likes Blog", () => {
  let blogs = [
    {
      title: "Go To Statement Considered Harmful",
      author: "Edsger W. Dijkstra",
      likes: 5,
    },
    {
      title: "Canonical string reduction",
      author: "MANUELITO",
      likes: 15,
    },
    {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      likes: 12,
    },
    {
      title: "Canonical string reduction",
      author: "MANUELITO",
      likes: 11,
    },
  ];

  test("when list has many blogs with differents authors, te most likes author", () => {
    const result = listHelper.mostLikes(blogs);
    assert.deepStrictEqual(result, {
      author: "MANUELITO",
      likes: 26,
    });
  });
});
