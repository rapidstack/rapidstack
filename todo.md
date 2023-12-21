# TODOs for API Handler Project MVP

- [ ] Clean up types

  - [ ] Separate common HTTP types from the ones that relate specifically to the handler
  - [ ] Typeof validate function param 0 needs to exist
  - [ ] Type of the lifecycle hooks can't be used realistically. See:
        [weird bang](https://github.com/zackheil/demo-api/blob/f8ba0e31b4953d300ff4e7d823196f38eb591b3d/packages/functions/src/api/index.ts#L57-L64) and [use of fn decl with type](https://github.com/zackheil/demo-api/blob/f8ba0e31b4953d300ff4e7d823196f38eb591b3d/packages/functions/src/api/handler-hooks/rate-limiter.ts#L6C45-L6C45)

  - [ ] Clean up handler types

- [ ] Clean up handler execution flow
- [ ] Write tests for `responseContext`
- [ ] Better typing on the `validate` function with its statics
- [ ] Add `_runWithEscapeHatch` as a static method to the `validate()` return?
- [ ] Add the routes to the handler args?
- [ ] Remove some unused stuff that won't make it as a part of the MVP. Doc for later
- [ ] Add meta info on the route chosen to the handler exe fn
  - [ ] give the "neighborhood" of routes matched
  - [ ] route path matched
  - [ ] route path params
