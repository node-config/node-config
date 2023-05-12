module.exports = {
    service: {
        name: "SERVICE_NAME",
        port: {
            __name: "SERVICE_PORT",
            __format: "number",
        },
        cors: {
            __name: "SERVICE_CORS",
            __format: "boolean",
        },
    },
    requests: {
        headers: {
            __name: "REQUESTS_HEADERS",
            __format: "json",
        },
    },
};
