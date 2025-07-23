## The Artificer API
The Artificer features an API that allows authenticated users to roll dice into Discord from third party applications (such as Excel macros).  The API has a couple endpoints exposed to all authenticated users allowing management of channels that your API key can send rolls to.

Guilds Owners or Admins must run the `[[api allow` command for any users to be able to use the `/api/roll` endpoint.

Every API request **requires** the header `X-Api-Key` with the value set to the API key granted to you.

* If an API fails, these are the possible responses:
  * `400` - Bad Request - Query parameters missing or malformed.
  * `403` - Forbidden - API Key is not authenticated or user does not match the owner of the API Key.
  * `404` - Not Found - Requested endpoint does not exist.
  * `429` - Too Many Requests - API rate limit exceeded, please slow down.
  * `500` - Internal Server Error - Something broke, if this continues to happen, please submit a GitHub issue.

Official API URL: `https://artificer.eanm.dev/api/`

API Documentation can be found in the `.bruno` folder, which can be viewed in [Bruno](https://www.usebruno.com/).  API requests listed in the `Authenticated/Admin Requests` are only available to the admin user defined in `config.ts`.

API Key management via a basic GUI is available on the [API Tools](https://artificer.eanm.dev/) website.
