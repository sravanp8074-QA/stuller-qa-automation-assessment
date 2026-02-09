declare namespace Cypress{
    interface Chainable{
        loginStuller(): Chainable<void>;
        searchFromHome(itemNumber: string): Chainable<void>;
        clearCart(): Chainable<void>;
    }
}