package project4.jugglingclub.sim.models;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
// data to be noted: should probly limit var to var(255)
public interface usersRepository extends JpaRepository<user, Integer> {
    Optional<user> findByName(String uniqueName); // this should make it so I get back the data via names
}