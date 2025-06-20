use crate::me::Me;
#[test]
// This test verifies that a new identity file can be created and then successfully unlocked
// using the same hash. It ensures that the username is correctly assigned and the unlock operation works as expected.
fn test_create_unlock() {
    let mut me = Me::create("tester", "hash123").unwrap();
    assert!(me.unlock("hash123").unwrap());
    assert_eq!(me.username, "tester");
}
#[test]
// This test ensures that a Me instance is correctly created and that the associated file path exists on disk.
fn test_me_creation() {
    let username = "testuser";
    let hash = "fakepasswordhash";
    let me = Me::create(username, hash).unwrap();
    assert_eq!(me.username, username);
    assert!(me.file_path.exists());

    // Optional: Clean up test file to keep ~/.this/me tidy
    std::fs::remove_file(&me.file_path).ok();
}
#[test]
// This test ensures that attempting to unlock a Me identity with an incorrect hash returns false.
fn test_me_unlock_fail() {
    let username = "failuser";
    let correct_hash = "correcthash";
    let wrong_hash = "wronghash";
    let mut me = Me::create(username, correct_hash).unwrap();
    let result = me.unlock(wrong_hash).unwrap();
    assert!(!result);

    // Cleanup
    std::fs::remove_file(&me.file_path).ok();
}