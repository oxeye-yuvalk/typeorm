import "reflect-metadata";
import { Connection, Repository } from "../../../src/index";
import { reloadTestingDatabases, createTestingConnections, closeTestingConnections } from "../../utils/test-utils";
import { expect } from "chai";
import { Category } from "./entity/Category";
import { Post } from "./entity/Post";

describe.only("Soft Delete Recursive cascade", () => {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: Connection[] = [];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],

    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("when a Post is removed from a Category", () => {
        let categoryRepository: Repository<Category>;
        let postRepository: Repository<Post>;

        beforeEach(async () => {
            await Promise.all(connections.map(async connection => {
                categoryRepository = connection.getRepository(Category);
                postRepository = connection.getRepository(Post);
            }));

            const categoryToInsert = await categoryRepository.save(new Category());
            categoryToInsert.posts = [
                new Post(),
                new Post()
            ];

            await categoryRepository.save(categoryToInsert);
            await categoryRepository.softRemove(categoryToInsert);
        });

        it("should delete the category", async () => {
            const categoryCount = await categoryRepository.count();
            expect(categoryCount).to.equal(0);
        });

        it("should delete the all the posts", async () => {
            const postCount = await postRepository.count();
            expect(postCount).to.equal(0);
        });
    });
});
