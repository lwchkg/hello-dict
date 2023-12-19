/// <reference types="cypress" />

describe("Hello Dict app", () => {
  it("Type in a word and press enter", () => {
    cy.visit("/");
    const element = cy.get(".word-input input");
    element.type("test").should("have.value", "test");
    element.type("\n");
    cy.hash().should("eq", "#/word/test");

    // The dictionary entries should load with an entry with the word.
    // Comparison is not case-sensitive because GCIDE capitalizes headwords.
    cy.get(".dict-item").contains(/\btest\b/i);
  });

  it("Type in a word and press the button", () => {
    cy.visit("/");
    cy.get(".word-input input").type("test").should("have.value", "test");
    cy.get(".word-input button").click();
    cy.hash().should("eq", "#/word/test");

    // The dictionary entries should load with an entry with the word.
    // Comparison is not case-sensitive because GCIDE capitalizes headwords.
    cy.get(".dict-item").contains(/\btest\b/i);
  });

  it("Visit #/word/:word", () => {
    cy.visit("/#word/test");

    // The dictionary entries should load with an entry with the word.
    // Comparison is not case-sensitive because GCIDE capitalizes headwords.
    cy.get(".dict-item").contains(/\btest\b/i);
  });
});
