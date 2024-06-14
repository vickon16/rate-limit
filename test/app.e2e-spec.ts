import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto/create-bookmark.dto';
import { EditBookmarkDto } from 'src/bookmark/dto/edit-bookmark.dto';

// End to End testing

const authorization = {
  Authorization: 'Bearer $S{user_access_token}',
};

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    app.init();
    await app.listen(3333);

    // clean the prisma db before running tests
    // make sure you are not using a production database in the testing environment
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@example.com',
      password: 'test-password',
    };

    describe('Signup', () => {
      it('should throw an error is there is no email', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody({ ...dto, email: undefined })
          .expectStatus(400);
      });
      it('should signup', () => {
        return pactum
          .spec()
          .post(`/auth/signup`)
          .withBody(dto)
          .expectStatus(201)
          .stores('user_access_token', 'access_token');
      });
    });
    describe('Signin', () => {
      it('should throw an error is there is no email', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({ ...dto, email: undefined })
          .expectStatus(400);
      });
      it('should throw an error if password is invalid', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody({ ...dto, password: 'test' })
          .expectStatus(403);
      });
      it('should signin', () => {
        return pactum
          .spec()
          .post(`/auth/signin`)
          .withBody(dto)
          .expectStatus(200);
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get(`/users/me`)
          .withHeaders(authorization)
          .expectStatus(200);
      });
    });
    describe('Edit user', () => {
      const dto: EditUserDto = {
        email: 'test@example2.com',
      };

      it('should get edit user', () => {
        return pactum
          .spec()
          .patch(`/users`)
          .withHeaders(authorization)
          .withBody(dto)
          .expectStatus(200);
      });
    });
  });

  describe('Bookmark', () => {
    describe('Get Empty bookmark', () => {
      it('it should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders(authorization)
          .expectStatus(200)
          .expectBody([]);
      });
    });
    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'first bookmark',
        link: 'https://www.example.com',
      };
      it('it should create bookmarks', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBody(dto)
          .withHeaders(authorization)
          .expectStatus(201)
          .stores('bookmark_id', 'id');
      });
    });
    describe('Get bookmark', () => {
      it('it should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders(authorization)
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });
    describe('Get bookmark with Id', () => {
      it('it should get a single bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders(authorization)
          .expectStatus(200)
          .expectBodyContains('$S{bookmark_id}');
      });
    });
    describe('Edit bookmark', () => {
      const dto: EditBookmarkDto = {
        description: 'Newly created bookmark',
      };

      it('it should edit a bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withBody(dto)
          .withHeaders(authorization)
          .expectStatus(200)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark', () => {
      it('it should delete a bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders(authorization)
          .expectStatus(204);
      });

      it('it should get empty bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmark_id}')
          .withHeaders(authorization)
          .expectStatus(200)
          .expectJsonLength(0);
      });
    });
  });
});
