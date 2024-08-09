const { getRoleList } = require("../roleList");

class MemberChecking {
    constructor(member) {
        this.member = member;
        this.roles = member.roles.cache;
        this.valid = true;
        this.missing = [];
    }

    async check() {

        const roleList = await getRoleList();

        for (const roleCategory of roleList) {
            const categoryName = roleCategory.type;
            const roles = roleCategory.roles;

            let find = false;
            for (const role of roles) {
                const role_ID = role.id;
                const role_NAME = role.name;

                if (this.roles.has(role_ID)) {
                    find = true;
                    break;
                }
            }

            if (!find) {
                this.valid = false;
                this.missing.push(categoryName);
            }
        }
    }
}

module.exports = MemberChecking;