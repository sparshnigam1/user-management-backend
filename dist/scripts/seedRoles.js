import { RolesModel } from "@/models/roles.model.js";
async function main() {
    await RolesModel.seed();
    console.log("Roles seeded successfully.");
    process.exit(0);
}
main().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
//# sourceMappingURL=seedRoles.js.map