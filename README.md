## <a href="https://links.jessejesse.com">Links</a>
#### create calendar events of any type
#### serverless postgreSQL intigration


<img width="1687" height="1159" alt="shapes at 25-12-13 00 15 14" src="https://github.com/user-attachments/assets/94801a83-a5d8-463c-adf1-745a2857297f" />


### Likes API
 
A lightweight API for tracking page likes with user deduplication, built with TypeScript, Express.js, and PostgreSQL.

## Features

 
- ✅ Track page likes with user-based deduplication

- ✅ Real-time like count updates

- ✅ RESTful API endpoints

- ✅ PostgreSQL with connection pooling

- ✅ Automatic database schema initialization

- ✅ Row-level security policies (if enabled)

- ✅ Efficient indexing for performance


## Tech Stack

 
- ****Runtime****: Node.js

- ****Framework****: Express.js

- ****Language****: TypeScript

- ****Database****: PostgreSQL (hosted on Neon)

- ****ORM****: pg (PostgreSQL client for Node.js)

- ****Authentication****: JWT (via Supabase Auth)

  

## Prerequisites

  

- Node.js 18+

- PostgreSQL database (Neon recommended)

- npm or yarn package manager

  

## Installation

  

1. Clone the repository
```
git clone https://github.com/sudo-self/links.git && cd links
 
```

2. Install
```
npm install

```

3. env example

```

DATABASE_URL=postgresql://username:password@ep-project.neon.tech/dbname

PORT=3000

NODE_ENV=development

```

4. Database Schema:

- page_stats table
```
CREATE TABLE page_stats (

page_id VARCHAR(255) PRIMARY KEY,

like_count INTEGER DEFAULT 0,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
```
- page_likes table

```  

CREATE TABLE page_likes (

id BIGSERIAL PRIMARY KEY,

page_id VARCHAR(255) NOT NULL,

user_hash VARCHAR(255) NOT NULL,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

UNIQUE(page_id, user_hash),

FOREIGN KEY (page_id) REFERENCES page_stats(page_id) ON DELETE CASCADE

);

 ```
