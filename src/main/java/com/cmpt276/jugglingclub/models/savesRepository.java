package com.cmpt276.jugglingclub.models;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.ArrayList;
import java.util.Optional;
// data to be noted: should probly limit var to var(255)
public interface savesRepository extends JpaRepository<save, Integer> {
    ArrayList<save> findAllByName(String uniqueName);
    Optional<save> findByUid(int uid);
    ArrayList<save> findAll();
} // this should give me all the custum saves by a person, and since each new saves from different simualtor would be
    // a subclass, this should be able to fetch them all.
    