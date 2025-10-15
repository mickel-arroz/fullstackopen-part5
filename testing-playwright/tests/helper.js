const loginWith = async (page, username, password) => {
  await page.getByRole('button', { name: 'log in' }).click();
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill(password);
  await page.getByRole('button', { name: 'login' }).click();
  // Espera a que la UI de usuario autenticado esté disponible (botón "new note")
  await page.getByRole('button', { name: 'new note' }).waitFor();
};

const createNote = async (page, content) => {
  await page.getByRole('button', { name: 'new note' }).click();
  await page.getByRole('textbox').fill(content);
  await page.getByRole('button', { name: 'save' }).click();
  // Espera a que la nota recién creada aparezca en el DOM
  await page.getByText(content).last().waitFor();
};

export { loginWith, createNote };
