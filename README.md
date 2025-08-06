# EVAL

Eval is an educational platform designed to create and distribute training exercises and conduct exams across engineering and other disciplines. With a core focus on ease of use and simplicity, Eval ensures a seamless experience for educators and students.

Eval provides comprehensive insights into student engagement and understanding, enabling more effective assessments of student performance and comprehension.

Originally developed for HEIG-VD, EVAL is now available to the wider educational community, offering robust tools for creating and managing online evaluations.

## Features

### Questions

Eval sets itself apart with a specialized set of questions tailored for software engineering, offering unique capabilities.

Code Writing question enables students to write and execute code (JavaScript, Python, Java, C, C++, Golang, etc.) in a sand-boxed environment using an online editor powered by Monaco, similar to Visual Studio Code. This feature allows students to make sure their code meets the expected output, providing a more interactive and engaging experience.

Eval is also committed to expanding its offerings by tailoring question types adapted for a wide range of educational fields in science and beyond.

- **True/False**: Simple binary questions.
- **Multiple Choice**: Questions with multiple possible answers.
- **Essay**: Open-ended questions for detailed responses.
- **Web**: Questions related to CSS, HTML, and JavaScript.
- **Code Reading**: Understand the code and predict its output.
- **Code Writing**: Complete the code, run code checks, and test the output.
- **Database**: PostgreSQL-focused questions to complete queries and obtain expected results.

### Evaluation Management

EVAL simplifies evaluation management through four distinct phases:

1. **Draft Phase**: Educators can create and customize evaluations by selecting a collection of questions, organizing their order, and assigning point values. Students register using an evaluation link, with optional access restrictions.

2. **In Progress Phase**: Educators monitor registered students and their progress in real-time, allowing or prohibiting access to the evaluation and gaining insights from the analytics page.

3. **Grading Phase**: EVAL streamlines grading with automation, allowing educators to review, adjust grades, provide comments, and sign off. Annotations can be added for specific question types, and overall results are visible as grading progresses.

4. **Finished Phase**: Students receive their grades and feedback, while educators have access to comprehensive results, with options to update grades and download reports in CSV and PDF formats.

## Tech Stack
- Frontend: Next.js 14
- Backend: Prisma ORM
- Database: PostgreSQL

## Development Setup

The current implementation of EVAL uses Keycloak as the Identity Provider (IDP).

However, the platform is built on Next.js and uses NextAuth, making it easy to configure with other IDPs or with your existing IDP.

To configure a different IDP, refer to the NextAuth configuration in the file located at ./web/pages/api/auth/[...nextauth].js and consult the NextAuth documentation. [next-auth](https://next-auth.js.org/v3/getting-started/introduction)

### Prerequisites

- Node.js V20+
- Docker
- Docker Compose

### Dev Docker Composer

At `/dev` directory, you can find a `docker-compose.yml` file that will start the database and Keycloak server.

In this approach, your database and IDP will be running in docker while the next.js app will be running on your local machine.

```bash
cd dev
docker compose up
```

### Keycloak Setup

> [!warning] This step is no longer necessary, as we are now using SWITCH edu-id as the IDP. You may skip to the next section.

Once the container is running, you can access the Keycloak admin console at `http://localhost:8080/`, with the default credentials `admin` for both username and password. You are then able to setup your Keycloak environment.

- Create a new realm called `eval` (`Manage realms > Create realms`, no need to provide a resource file).
- Create a new client called `eval-client` in the realm `eval`:
  - Make sure the `eval` realm is selected on the `Manage realms` page, then go to `Clients > Create Client`.
  - Client Type `OpenID Connect`, ClientID and Name `eval-client`, then hit `Next`;
  - Client Authentication: `On`, the rest left as default, then hit `Next`.
  - Root Url: `https://localhost:3000` (the url of your eval app on localhost), the rest left as default, then hit `Next`.
- Create your first eval user by going to `Users > Create User`, while the `eval` realm is selected.
  - Fill in the following fields, then submit.
    - Username: `eval-user`
    - Email: `eval-user@eval.com` (email is mandatory as NextAuth uses email as uniq identifier)
    - Arbitrary First and Last name
  - Go to the `Credentials` tab and hit `Set Password`
    - Set the password: `eval-user`
    - Temporary: `off`

Finally, you will need to configure Next.js to be able to connect to Keycloak using the client you just created. To this end, in the Keycloak admin console, go to `Clients > eval-client > Credentials` and copy the `Client Secret`.

You may now create a `.env.local` file in the `web` directory with the following content:

```bash
NEXTAUTH_KEYCLOAK_CLIENT_ID=eval-client
NEXTAUTH_KEYCLOAK_CLIENT_SECRET=<client secret>
NEXTAUTH_KEYCLOAK_ISSUER_BASE_URL=http://localhost:8080/realms/eval
```

### Eval Environment Variables

You will now need to configure the Next.js app to be able to use the SWITCH edu-id as the IDP. This will require a SWITCH client secret that is available in the [IICT Vault](https://vault.iict-heig-vd.in/). You may need to ask someone from the IICT team to provide you with access to the vault.

You will also need to generate a secret for NextAuth, which you can do by running the following command in your terminal:

```bash
openssl rand -base64 32
```

You can now create a `.env.local` file (or add to it if it already exists) in the `web` directory with the following content.

```bash
NEXTAUTH_SECRET=<NextAuth secret>

NEXTAUTH_SWITCH_ORGANIZATION_DOMAINS=heig-vd.ch,hes-so.ch,master.hes-so.ch
NEXTAUTH_SWITCH_CLIENT_ID=hes-so_open_didac
NEXTAUTH_SWITCH_CLIENT_SECRET=<switch client secret>

NEXTAUTH_URL=https://localhost:3000
```

You will also need to provide the database url for Prisma to connect to the database running in the docker container. Create a `.env` file in the `web` directory with the following content:

```bash
DATABASE_URL="postgresql://eval-dev:eval-dev@localhost:5432/eval-dev"
```

### Install the app dependencies

REMINDER: Make sure you use the node version 20+.

```bash
cd web
npm install
```

### Run the database migrations

Make sure your database container is running. Then, run the following command to apply the migrations.

```bash
cd web
npx prisma migrate dev
```

You should see the following output: `Your database is now in sync with your schema.`

> If you encounter an access denied error, you might have another instance of postgres running on your machine. Make sure to stop it and restart the docker container before trying again.

### Run the app in development mode

```bash
cd web
npm run dev
```

You might need to clear your browser cache for the page to load correctly.

### Setup your super admin user

#### Signing into eval

Open your browser and go to `https://localhost:3000`. Hit Sign in, then Sign in with SWITCH edu-id. Use your SWITCH edu-id credentials to sign in.

You should now see a message saying `You are not authorized to view this page`. This is expected, as upon first login, a user is created for you in the database, with `STUDENT` role only as default.

#### Promote to PROFESSOR and SUPER_ADMIN

To promote your user to a professor and super admin, you need to update the role in the database.

```bash
docker exec -it eval-dev-infra-dev-db-1 psql -U eval-dev -d eval-dev -c "UPDATE \"User\" SET roles = '{STUDENT,PROFESSOR,SUPER_ADMIN}' WHERE email = 'your@email.com';"
# where `your@email.com` is the email address you used to sign in through SWITCH edu-id.
```

Depending on your config, you might need to adjust the container name, user email and sql credentials.

You should see the following output: `UPDATE 1`.

> [!NOTE] Troubleshooting
>
> - If the `User` table is not found, make sure the prisma migrations were successful, and that the `DATABASE_URL` is correct, as it might be that the migrations were applied to the wrong database.
> - If you see `UPDATE 0`, it means your user was not found in the database, and thus probably not correctly created. Check the email address you used in the command; it should match the email you used to sign in with SWITCH edu-id, or be your `@heig-vd.ch` address. You may also need to restart the docker container and frontend, then try logging in again for the user to be created.

### Create your first group

Now, you can refresh the page.

You will see the message has change to `You are not a member of any groups.` with the possibility to create a new group.

You are now done! Feel free to create your very first group through the interface. Welcome to eval!
