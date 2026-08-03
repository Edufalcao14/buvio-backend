# Avatars and crests upload directly to R2 from the app

Images are stored in Cloudflare R2. The app asks the backend for a pre-signed
upload URL, resizes the picture locally, uploads the bytes straight to the
bucket, and then confirms the object key through a mutation. The image bytes
never pass through our server.

We picked this over proxying uploads because a phone camera picture is 5–10 MB
and an avatar needs about 10 KB: proxying would put that traffic, and the
resizing CPU, on a server that otherwise only moves small JSON payloads.

## Consequences

The client is trusted to produce a sane image, so the guard rails live in the
signature: the pre-signed URL pins content type and a maximum size, and the
confirming mutation is what actually attaches an image to a Player or a Team.
An object uploaded but never confirmed is garbage and needs collecting.

Because signing requires an authenticated caller, a picture chosen during
sign-up can only be uploaded after the account exists. Sign-up therefore
creates the account first and attaches the avatar immediately after — a failed
upload leaves a usable account without a picture, never a lost sign-up.
