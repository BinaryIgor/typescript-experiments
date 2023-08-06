import * as Views from "../shared/views";

export const SIGN_FORM_LABEL = "sign-in-form";

//TODO: styled signIn page!
export function signInPage(signInEndpoint: string,
    validateNameEndpoint: string,
    validatePasswordEndpoint: string,
    renderFullPage: boolean): string {
    const page = `<form class="p-4 shadow-md relative"
        hx-post="${signInEndpoint}"
        hx-target="#${Views.ROOT_ID}"
        hx-replace-url="/">
        ${Views.inputWithHiddenError("name", "Your name...", validateNameEndpoint)}
        ${Views.inputWithHiddenError("password", "Your password...", validatePasswordEndpoint, "password")}
        <input class="absolute bottom-0 right-0 p-4 ${Views.DISABLED_CLASS}" type="submit" value="Sign In"
        ${Views.SUBMIT_FORM_LABEL}="${SIGN_FORM_LABEL}" disabled>
    </form>`;
    return renderFullPage ? Views.wrappedInMainPage(page, null) : page;
}