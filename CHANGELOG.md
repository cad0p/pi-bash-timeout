# Changelog

All notable changes to this project will be documented in this file.

## [calver-released]

<!-- USER-EDITABLE SECTION START -->
<!-- Add your curated release notes here. -->
<!-- USER-EDITABLE SECTION END -->

### 📚 Documentation

- Add one-time npm trusted publishing setup instructions ([#1](https://github.com/cad0p/pi-bash-timeout/pull/1))


## [0.1.0] - 2026-06-30

<!-- USER-EDITABLE SECTION START -->

Initial release.

`pi-bash-timeout` re-registers pi's built-in `bash` tool with a 120-second default timeout. When the agent omits the `timeout` parameter, the extension injects `120`; an explicit `timeout` always wins.

- Preserves the stock bash tool renderer (`$ command` call line + `Took X.Xs` footer) by spreading the built-in `ToolDefinition` from `createBashToolDefinition()` and overriding only `execute`.
- Delegates execution to the built-in bash implementation, scoped to `ctx.cwd` so commands run in the correct project directory.
- Appends `(default timeout: 120s when omitted)` to the tool description so the LLM knows the fallback.

<!-- USER-EDITABLE SECTION END -->
