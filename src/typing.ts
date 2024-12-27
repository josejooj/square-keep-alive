import { APIUser, APIUserApplication } from "@squarecloud/api-types/v2";

declare global {
    var user: APIUser
    var applications: APIUserApplication[];
}