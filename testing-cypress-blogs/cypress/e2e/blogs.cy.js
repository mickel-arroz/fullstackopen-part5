describe('Blog app', function () {
  beforeEach(function () {
    // reset the backend db
    cy.request('POST', `${Cypress.env('BACKEND')}/testing/reset`);

    // create a user for testing
    const user = {
      name: 'Mickel Arroz',
      username: 'micka',
      password: 'secret',
    };
    cy.request('POST', `${Cypress.env('BACKEND')}/users`, user);

    cy.visit('/');
  });

  it('Login form is shown by default', function () {
    cy.contains('h2', 'Login');
    cy.get('#username').should('exist');
    cy.get('#password').should('exist');
    cy.contains('button', 'login').should('exist');
  });

  describe('Login', function () {
    it('succeeds with correct credentials', function () {
      cy.get('#username').type('micka');
      cy.get('#password').type('secret');
      cy.contains('button', 'login').click();

      cy.contains('Mickel Arroz logged-in');
    });

    it('fails with wrong credentials', function () {
      cy.get('#username').type('micka');
      cy.get('#password').type('wrong');
      cy.contains('button', 'login').click();

      cy.get('#notification')
        .should('contain', 'Wrong credentials')
        .and('have.class', 'error')
        .and('have.css', 'color', 'rgb(153, 27, 27)');

      cy.get('html').should('not.contain', 'Mickel Arroz logged-in');
    });
  });

  describe('When logged in', function () {
    beforeEach(function () {
      // log in programmatically and save token alias
      cy.request('POST', `${Cypress.env('BACKEND')}/login`, {
        username: 'micka',
        password: 'secret',
      }).then(({ body }) => {
        cy.wrap(body.token).as('token');
        cy.visit('/', {
          onBeforeLoad(win) {
            win.localStorage.setItem('loggedBlogAppUser', JSON.stringify(body));
          },
        });
      });
    });

    it('A blog can be created', function () {
      cy.contains('new blog').click();
      cy.get('#title').type('a blog created by cypress');
      cy.get('#author').type('Cypress Tester');
      cy.get('#url').type('http://example.com');
      cy.contains('create').click();

      cy.contains('a blog created by cypress by Cypress Tester');
      cy.get('#notification')
        .should('contain', 'A new blog was created')
        .and('have.class', 'success');
    });

    it('A blog can be liked', function () {
      // create blog via API using stored token
      cy.get('@token').then((token) => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('BACKEND')}/blogs`,
          body: {
            title: 'blog to like',
            author: 'Cypress',
            url: 'http://example.com',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });

      cy.visit('/');

      cy.contains('blog to like by Cypress')
        .parent()
        .parent()
        .within(() => {
          cy.contains('button', 'view').click();
          cy.contains('likes: 0');
          cy.contains('button', 'like').click();
          cy.contains('likes: 1');
        });
    });

    it('A blog can be deleted by its creator', function () {
      // create blog via API using stored token
      cy.get('@token').then((token) => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('BACKEND')}/blogs`,
          body: {
            title: 'blog to delete',
            author: 'Cypress',
            url: 'http://example.com',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });

      cy.visit('/');

      cy.contains('blog to delete by Cypress')
        .parent()
        .parent()
        .within(() => {
          cy.contains('button', 'view').click();
          cy.on('window:confirm', () => true);
          cy.contains('button', 'DELETE').click();
        });

      cy.get('html').should('not.contain', 'blog to delete by Cypress');
      cy.get('#notification')
        .should('contain', 'Blog deleted')
        .and('have.class', 'success');
    });

    it('Only creator sees delete button', function () {
      // create a blog as the original user
      cy.get('@token').then((token) => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('BACKEND')}/blogs`,
          body: {
            title: 'blog delete visibility',
            author: 'Cypress',
            url: 'http://example.com',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });

      // create another user
      const other = { name: 'Not Owner', username: 'other', password: 'pass' };
      cy.request('POST', `${Cypress.env('BACKEND')}/users`, other);

      // login as other and verify delete button is not visible
      cy.request('POST', `${Cypress.env('BACKEND')}/login`, {
        username: 'other',
        password: 'pass',
      }).then(({ body }) => {
        cy.visit('/', {
          onBeforeLoad(win) {
            win.localStorage.setItem('loggedBlogAppUser', JSON.stringify(body));
          },
        });

        cy.contains('blog delete visibility by Cypress')
          .parent()
          .parent()
          .within(() => {
            cy.contains('button', 'view').click();
            cy.contains('button', 'DELETE').should('not.exist');
          });

        // login back as creator and verify delete button exists
        cy.request('POST', `${Cypress.env('BACKEND')}/login`, {
          username: 'micka',
          password: 'secret',
        }).then(({ body }) => {
          cy.visit('/', {
            onBeforeLoad(win) {
              win.localStorage.setItem(
                'loggedBlogAppUser',
                JSON.stringify(body)
              );
            },
          });

          cy.contains('blog delete visibility by Cypress')
            .parent()
            .parent()
            .within(() => {
              cy.contains('button', 'view').click();
              cy.contains('button', 'DELETE').should('exist');
            });
        });
      });
    });

    it('Blogs are ordered by likes', function () {
      cy.get('@token').then((token) => {
        // create blogs with different likes counts
        cy.request({
          method: 'POST',
          url: `${Cypress.env('BACKEND')}/blogs`,
          body: {
            title: 'second most liked',
            author: 'Cypress',
            url: 'http://example.com',
            likes: 5,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        cy.request({
          method: 'POST',
          url: `${Cypress.env('BACKEND')}/blogs`,
          body: {
            title: 'most liked',
            author: 'Cypress',
            url: 'http://example.com',
            likes: 10,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        cy.request({
          method: 'POST',
          url: `${Cypress.env('BACKEND')}/blogs`,
          body: {
            title: 'third liked',
            author: 'Cypress',
            url: 'http://example.com',
            likes: 3,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
      });

      cy.visit('/');

      cy.get('.blog').eq(0).should('contain', 'most liked by Cypress');
      cy.get('.blog').eq(1).should('contain', 'second most liked by Cypress');
      cy.get('.blog').eq(2).should('contain', 'third liked by Cypress');
    });
  });
});
