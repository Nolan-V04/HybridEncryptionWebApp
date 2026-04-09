import { test, expect } from "@playwright/test";

async function generateKeys(request) {
  const response = await request.post("http://127.0.0.1:5000/api/keys/generate");
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test("encrypt page validates required inputs", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Encrypt", exact: true }).last().click();
  await expect(page.locator(".status")).toContainText("Please select a source file.");
});

test("decrypt page validates required inputs", async ({ page }) => {
  await page.goto("/");
  await page.locator("nav.tabs button", { hasText: "Decrypt" }).click();

  await page.getByRole("button", { name: "Decrypt", exact: true }).last().click();
  await expect(page.locator(".status")).toContainText("Please select a .hybrid payload file.");
});

test("encrypt flow completes successfully from UI", async ({ page, request }) => {
  const keys = await generateKeys(request);

  await page.goto("/");
  await page.locator("#encrypt-source").setInputFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Playwright functional test", "utf8"),
  });

  await page.getByPlaceholder("-----BEGIN PUBLIC KEY-----").fill(keys.public_key);
  await page.getByRole("button", { name: "Encrypt", exact: true }).last().click();

  await expect(page.locator(".status")).toContainText("Encryption successful. Hybrid payload downloaded.");
});

test("decrypt flow completes successfully from UI", async ({ page, request }) => {
  const keys = await generateKeys(request);

  const encryptResponse = await request
    .post("http://127.0.0.1:5000/api/encrypt", {
      multipart: {
        publicKey: keys.public_key,
        file: {
          name: "source.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("UI decrypt functional test", "utf8"),
        },
      },
    });

  expect(encryptResponse.ok()).toBeTruthy();
  const payloadBuffer = Buffer.from(await encryptResponse.body());

  await page.goto("/");
  await page.locator("nav.tabs button", { hasText: "Decrypt" }).click();
  await page.locator("#decrypt-source").setInputFiles({
    name: "source.txt.hybrid",
    mimeType: "application/octet-stream",
    buffer: payloadBuffer,
  });
  await page.getByPlaceholder("-----BEGIN PRIVATE KEY-----").fill(keys.private_key);
  await page.getByRole("button", { name: "Decrypt", exact: true }).last().click();

  await expect(page.locator(".status")).toContainText("Decryption successful. Original file downloaded.");
});
