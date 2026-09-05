package com.casetool.backend.modules.project;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.project.dto.ProjectRequest;
import com.casetool.backend.modules.project.dto.ProjectResponse;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> findAll() {
        return projectRepository.findAll().stream().map(ProjectResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(Long id) {
        return ProjectResponse.from(getOrThrow(id));
    }

    public ProjectResponse create(ProjectRequest request) {
        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        return ProjectResponse.from(projectRepository.save(project));
    }

    public ProjectResponse update(Long id, ProjectRequest request) {
        Project project = getOrThrow(id);
        project.setName(request.name());
        project.setDescription(request.description());
        return ProjectResponse.from(projectRepository.save(project));
    }

    public void delete(Long id) {
        if (!projectRepository.existsById(id)) {
            throw ResourceNotFoundException.of("Proyecto", id);
        }
        projectRepository.deleteById(id);
    }

    public Project getOrThrow(Long id) {
        return projectRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Proyecto", id));
    }
}
