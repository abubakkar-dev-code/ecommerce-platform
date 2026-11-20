"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserDto = void 0;
// Explicit construction keeps current and future authentication fields private,
// even when a newly created document or password-selected query is supplied.
const toUserDto = (user) => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
});
exports.toUserDto = toUserDto;
