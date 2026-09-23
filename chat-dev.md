> > ### Environment
> > 
> > * OS: Windows (ARM)
> > * Browser: Brave
> > * Node.js: N/A (deployed directly via Vercel template gallery, no local setup involved)
> > * Package manager: N/A (deployed directly via Vercel template gallery, no local setup involved)
> > 
> > ### Version
> > Latest (deployed via Vercel template gallery)
> > ### Reproduction
> > 
> > 1. Go to the Vercel template page for the eve personal agent (Nuxt): https://vercel.com/new/om-personal/templates/nuxt/eve-personal-agent
> > 2. Click deploy to create a new project from the template
> > 3. Deployment fails during "Preparing deployment" with the error shown below
> > 
> > ### Description
> > When deploying the template, Vercel returns the error:
> > The `experimentalServices` property is no longer available for new projects. Use the `services` property instead.
> > Expected: the deployment completes successfully using the template's default Vercel configuration.
> > Actual: deployment fails immediately with the error above, before build logs or deployment summary populate.
> > This suggests a config file in the template (likely `vercel.json`) still references the old `experimentalServices` key for the multi-service (`web` + `eve`) setup. New Vercel projects reject this key and expect `services` instead.
> > <img alt="Image" width="1092" height="567" src="https://private-user-images.githubusercontent.com/163116269/637953411-c99a5ca0-550e-4925-83c2-e98cf3662159.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTAxODY2OTIsIm5iZiI6MTc5MDE4NjM5MiwicGF0aCI6Ii8xNjMxMTYyNjkvNjM3OTUzNDExLWM5OWE1Y2EwLTU1MGUtNDkyNS04M2MyLWU5OGNmMzY2MjE1OS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwOTIzJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDkyM1QxNzU5NTJaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1iYTYyODNiMjJiMDljYWYyOTRmMjI4YjVmZjdkZTQzOTM4NzZiZDMzMTIzNjk1YWQ1M2MyZjMyOTkwY2RkYzBlJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZwbmcifQ.isQKuro08mL3SS8DfYYuuZrcmhZcvn4GCgzcF6OktY4">
> > ### Additional context
> > Error surfaced as a toast in the bottom right of the Vercel deploy screen, immediately after clicking Deploy from the template gallery, before any build logs appeared.
> > ### Logs
> > The `experimentalServices` property is no longer available for new projects. Use the `services` property instead.

