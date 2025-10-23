import request from 'supertest';

// NOTE: This is a scaffold; replace with real bootstrap and auth helpers.
describe('Social Endpoints (e2e)', () => {
  it.skip('GET /users/:id/followers should return paginated followers', async () => {
    // Replace with real app bootstrap and token acquisition
    // const app = await bootstrapTestApp();
    // const { accessToken } = await signInTestUser(app);
    // const res = await request(app.getHttpServer())
    //   .get(`/users/${targetUserId}/followers`)
    //   .set('Authorization', `Bearer ${accessToken}`)
    //   .expect(200);
    // expect(res.body).toHaveProperty('users');
    // expect(res.body).toHaveProperty('pageInfo');
  });

  it.skip('POST /users/:id/follow then DELETE should be idempotent', async () => {
    // Placeholder for follow/unfollow flow
  });
});
