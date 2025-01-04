import { NextResponse } from 'next/server';
import projectStore from '../../../lib/projectStore';

export async function GET() {
  try {
    await projectStore.initialize();
    const projects = await projectStore.getAllProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { title, description } = await request.json();
    const project = await projectStore.addProject(title, description);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 