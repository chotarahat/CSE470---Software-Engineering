## CSE470---Software-Engineering
The purpose of this course is to learn how to develop a software application from scratch.

## Project Name : Ventify (Non-Clinical)
## Description

A platform that offers anonymous, non-clinical support for students facing stress, anxiety, academic pressure, or personal challenges. It ensures privacy, connects students with counselors without revealing identity, and provides self-help resources along with administrative analytics.
SRS document: https://docs.google.com/document/d/12rxbVmFNjCOYSOCjuSBnnOXXdChIOsFnFUUPAYMyn6Q/edit?usp=sharing

## Features

- Anonymous Support Requests: Students can submit concerns without revealing identity.
- Counselor Assignment: Automatic or manual ticket assignment to available counselors.
- Ticket Tracking: Status updates (Open → Assigned → Responded → Closed).
- Messaging System: Structured communication between students and counselors.
- Privacy & Security: IP masking, encrypted passwords, role-based access control.
- Resource Library: Curated self-help materials with category filters and search.
- Analytics Dashboard: Reports on ticket volume, response times, and resolution statistics.
- Admin Controls: Manage counselors, resources, and system monitoring.

## Technologies Used 

- Backend: Node.js, Express.js, MongoDB, Mongoose
- Frontend: React.js, React Router, Axios, Context API (or Redux)
- Authentication & Security: JWT, bcrypt
- Database Hosting: MongoDB Atlas
- Visualization: Chart.js / Recharts
- Tools: GitHub (version control), Postman (API testing)

## Installation
- Clone the repository :
  git clone https://github.com/your-repo-link.git, 
  cd project-folder
- Backend setup :
  cd backend, 
  npm install, 
  npm start
- Frontend setup :
  cd frontend, 
  npm install, 
  npm start
- Database setup :
  Configure MongoDB Atlas connection string in .env file.

## Usage
- Students submit anonymous tickets via the frontend form.
- Counselors log in to view assigned tickets and respond.
- Admins manage counselors, resources, and monitor analytics.
- The dashboard provides insights into system performance and student needs.

## Contributors

- Md. Neamatullah Rahat
- Tasnim Zarin Jhilik
- Shams Tahmid Malitha Nafi
- Ahmed Mansib

