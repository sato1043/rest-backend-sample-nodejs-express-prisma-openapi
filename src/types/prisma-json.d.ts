declare global {
namespace PrismaJson {

    /**
     * usage;
     *
     * in a schema.prisma's Json field
     * ```
     *   model Example {
     *     /// [MyType]
     *     normal Json
     *     /// [MyType]
     *     optional Json?
     *   }
     * ```
     *
     * and in this type definition file
     * ```
     *   type MyType = {
     *     val: boolean;
     *   };
     * ```
     *
     * then `prisma generate`
     */

} // PrismaJson
} // global
