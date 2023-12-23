/// <reference types="cypress" />

describe("Hello Dict app", () => {
  it("Type in a word and press enter should load the dictionary entries.", () => {
    cy.visit("/");
    const element = cy.get(".word-input input");
    element.type("test").should("have.value", "test");
    element.type("\n");
    cy.hash().should("eq", "#/word/test");

    // The dictionary entries should load with an entry with the word.
    // Comparison is not case-sensitive because GCIDE capitalizes headwords.
    cy.get(".dict-item").contains(/\btest\b/i);
    cy.title().should("include", "test");
  });

  it("Type in a word and press the button should load the dictionary entries.", () => {
    cy.visit("/");
    cy.get(".word-input input").type("test").should("have.value", "test");
    cy.get(".word-input button").click();
    cy.hash().should("eq", "#/word/test");

    // The dictionary entries should load with an entry with the word.
    // Comparison is not case-sensitive because GCIDE capitalizes headwords.
    cy.get(".dict-item").contains(/\btest\b/i);
    cy.title().should("include", "test");
  });

  it("Visit #/word/:word should load the dictionary entries. A second visit should not reload dictionary data.", () => {
    cy.visit("/#word/test");

    // The dictionary entries should load with an entry with the word.
    // Comparison is not case-sensitive because GCIDE capitalizes headwords.
    cy.get(".dict-item").contains(/\btest\b/i);
    cy.title().should("include", "test");

    cy.visit("#/word/study");
    // The second visit should load instantiously.
    cy.get(".dict-item").contains(/\bstudy\b/i, { timeout: 100 });
    cy.title().should("not.include", "test");
    cy.title().should("include", "study");
  });

  it("Search with pattern should go to search results.", () => {
    cy.visit("/");
    cy.get(".word-input input").type("t?st").should("have.value", "t?st");
    cy.get(".word-input button").click();
    cy.hash().should("eq", "#/search/t%3Fst");

    cy.title().should("include", "t?st");
    cy.get(".search-result")
      .contains(/\btest\b/i)
      .click();

    cy.hash().should("eq", "#/word/test");
  });

  it("Search with an empty textbox should navigate to somewhere other than #/word/ or #/search/ .", () => {
    cy.visit("/#about");
    cy.get(".word-input button").click();
    // The browser should navigate to a new URL (no "about").
    cy.hash().should("not.include", "/about");
    cy.hash().should("not.include", "/word/");
    cy.hash().should("not.include", "/search/");
    cy.title().should("not.include", "- Hello");
  });
});
